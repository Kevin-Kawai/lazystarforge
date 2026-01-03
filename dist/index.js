#!/usr/bin/env node

// src/domain/entities/Message.ts
var EMessenger = /* @__PURE__ */ ((EMessenger2) => {
  EMessenger2["USER"] = "user";
  EMessenger2["SYSTEM"] = "system";
  return EMessenger2;
})(EMessenger || {});
var Message = class {
  messenger;
  content;
  constructor({ messenger, content }) {
    this.messenger = messenger;
    this.content = content;
  }
};

// src/gateway/ClaudeCodeGateway.ts
import { query } from "@anthropic-ai/claude-agent-sdk";
var ClaudeCodeGateway = class {
  static async *streamMessage(path3, content, sessionId) {
    console.log("session id");
    console.log(sessionId);
    for await (const message of query({
      prompt: content,
      options: {
        cwd: path3,
        resume: sessionId
      }
    })) {
      if (message.type === "assistant" && message.message?.content) {
        for (const block of message.message.content) {
          if ("text" in block) yield { type: "assistant_text", text: block.text, sessionId: message.session_id };
          else if ("name" in block) yield { type: "tool_call", name: block.name };
        }
      } else if (message.type === "result") {
        yield { type: "done", subtype: message.subtype };
      }
    }
  }
};

// src/repository/orchestratorRepository.ts
import { promises as fs2 } from "fs";
import { readdir, readFile } from "fs/promises";
import path2 from "path";

// src/utils/normalizeCwd.ts
import os from "os";
import path from "path";
import fs from "fs";
function normalizeCwd(p) {
  const expanded = p.startsWith("~/") ? path.join(os.homedir(), p.slice(2)) : p === "~" ? os.homedir() : p;
  const abs = path.resolve(expanded);
  if (!fs.existsSync(abs) || !fs.statSync(abs).isDirectory()) {
    throw new Error(`Invalid cwd (does not exist or not a directory): ${abs}`);
  }
  return abs;
}

// src/domain/entities/Project.ts
var Project = class {
  name;
  path;
  constructor(path3, name) {
    this.path = path3;
    this.name = name;
  }
};

// src/domain/entities/ProjectManager.ts
var ProjectManager = class {
  projects;
  constructor(projects2 = []) {
    this.projects = projects2;
  }
  addProject(project) {
    this.projects.push(project);
  }
  listProjects() {
    return this.projects;
  }
};

// src/domain/entities/Session.ts
var ESessionStatus = /* @__PURE__ */ ((ESessionStatus2) => {
  ESessionStatus2["ACTIVE"] = "active";
  ESessionStatus2["IDLE"] = "idle";
  return ESessionStatus2;
})(ESessionStatus || {});
var Session = class {
  status;
  worktree;
  project;
  claudeCodeSessionId;
  messages;
  updated;
  constructor(status = "idle" /* IDLE */, worktree, project, claudeCodeSessionId, messages2 = []) {
    this.status = status;
    this.worktree = worktree;
    this.project = project;
    this.claudeCodeSessionId = claudeCodeSessionId;
    this.messages = messages2;
    this.updated = false;
  }
  sendMessage(message) {
    this.messages.push(message);
    this.updated = true;
  }
  manualTakeover() {
  }
};

// src/domain/entities/SessionManager.ts
var SessionManager = class {
  sessions;
  constructor(sessions2 = []) {
    this.sessions = sessions2;
  }
  addSession(session) {
    this.sessions.push(session);
  }
  listSessions() {
    return this.sessions;
  }
};

// src/domain/entities/Orchestrator.ts
var Orchestrator = class {
  projectManager;
  sessionManager;
  constructor(projectManager = new ProjectManager(), sessionManager = new SessionManager()) {
    this.projectManager = projectManager;
    this.sessionManager = sessionManager;
  }
  newProject(...args) {
    const project = new Project(...args);
    this.projectManager.addProject(project);
  }
  listProjects() {
    return this.projectManager.listProjects();
  }
  newSession(...args) {
    const session = new Session("idle" /* IDLE */, ...args);
    this.sessionManager.addSession(session);
  }
  listSessions() {
    return this.sessionManager.listSessions();
  }
  sendMessage(messenger = "user" /* USER */, session, messageContent) {
    const message = new Message({ messenger, content: messageContent });
    session.sendMessage(message);
  }
  listMessages(session) {
    return session.messages;
  }
  takeoverSession(session) {
    session.manualTakeover();
  }
};

// src/factory/orchestratorFactory.ts
var OrchestratorFactory = class {
  projectsJson;
  sessionsJson;
  constructor(projects2, sessions2) {
    this.projectsJson = projects2;
    this.sessionsJson = sessions2;
  }
  generate() {
    const projects2 = this.parseProjects(this.projectsJson);
    const sessions2 = this.parseSessions(this.sessionsJson);
    return new Orchestrator(projects2, sessions2);
  }
  parseProjects(projectsJson) {
    const projects2 = projectsJson.map((json) => {
      return new Project(json["path"], json["name"]);
    });
    return new ProjectManager(projects2);
  }
  parseSessions(sessionsJson) {
    const sessions2 = sessionsJson.map((json) => {
      const status = this.parseSessionStatus(json["status"]);
      const project = new Project(json["project"]["path"], json["project"]["name"]);
      const messages2 = this.parseMessages(json["messages"]);
      return new Session(status, json["worktree"], project, json["claudeCodeSessionId"], messages2);
    });
    return new SessionManager(sessions2);
  }
  parseSessionStatus(input) {
    if (Object.values(ESessionStatus).includes(input)) {
      return input;
    }
    throw new Error("invalid session status");
  }
  parseMessages(messagesJson) {
    const messages2 = messagesJson.map((json) => {
      const messenger = this.parseMessenger(json["messenger"]);
      return new Message({ messenger, content: json["content"] });
    });
    return messages2;
  }
  parseMessenger(input) {
    if (Object.values(EMessenger).includes(input)) {
      return input;
    }
    throw new Error("invalid messege messenger");
  }
};

// src/repository/orchestratorRepository.ts
var filePath = normalizeCwd("~/.lazystarforge/data");
var OrchestratorRepository = class {
  static async find() {
    const rawProjects = await fs2.readFile(filePath + "/projects.json", "utf8");
    const sessions2 = await this.readSessions();
    const projects2 = JSON.parse(rawProjects);
    const orchestratorFactory = new OrchestratorFactory(projects2, sessions2);
    const orchestrator = orchestratorFactory.generate();
    return orchestrator;
  }
  static async save(orchestrator) {
    const projectsJson = await this.convertOrchestratorProjectsToJson(orchestrator.listProjects());
    await fs2.writeFile(filePath + "/projects.json", projectsJson, "utf8");
    await this.persistSessions(orchestrator.listSessions());
  }
  static async convertOrchestratorProjectsToJson(projects2) {
    return JSON.stringify(projects2, null, 2);
  }
  static async convertOrchestratorSessionsToJson(sessions2) {
    const sessionsToUpdate = sessions2.filter((session) => {
      return session.updated === true;
    });
    return JSON.stringify(sessionsToUpdate, null, 2);
  }
  static async persistSessions(sessions2) {
    console.log("sessionsssss");
    console.log(sessions2);
    sessions2.forEach(async (session) => {
      const sessionJson = JSON.stringify(session, null, 2);
      await fs2.writeFile(filePath + `/sessions/${session.claudeCodeSessionId}.json`, sessionJson, "utf8");
    });
  }
  static async readSessions() {
    const entries = await readdir(filePath + "/sessions", { withFileTypes: true });
    const jsonFiles = entries.filter((e) => e.isFile() && e.name.toLowerCase().endsWith(".json")).map((e) => path2.join(filePath + "/sessions", e.name));
    const results = await Promise.all(
      jsonFiles.map(async (filePath2) => {
        const text = await readFile(filePath2, "utf8");
        return JSON.parse(text);
      })
    );
    return results;
  }
};

// src/usecase/createFollowupMessageUseCase.ts
var createFollowupMessageUseCase = class {
  static async sendMessage(userMessage, sessionId) {
    const orchestrator = await OrchestratorRepository.find();
    const session = orchestrator.listSessions().find((session2) => {
      return session2.claudeCodeSessionId === sessionId;
    });
    if (session === void 0) throw new Error("invalid session");
    orchestrator.sendMessage("user" /* USER */, session, userMessage);
    for await (const event of ClaudeCodeGateway.streamMessage(session.project.path, userMessage, sessionId)) {
      if (event.type === "assistant_text") {
        orchestrator.sendMessage("system" /* SYSTEM */, session, event.text);
      }
    }
    await OrchestratorRepository.save(orchestrator);
  }
};

// src/usecase/listMessagesUseCase.ts
var ListMessagesUseCase = class {
  static async listMesseges(sessionId) {
    const orchestrator = await OrchestratorRepository.find();
    console.log("debug");
    console.log(orchestrator.listSessions());
    console.log(sessionId);
    const session = orchestrator.listSessions().find((session2) => {
      return session2.claudeCodeSessionId === sessionId;
    });
    if (session === void 0) throw new Error("invalid session");
    return orchestrator.listMessages(session);
  }
};

// src/usecase/listProjectsUseCase.ts
var ListProjectsUseCase = class {
  static async listProjects() {
    const orchestrator = await OrchestratorRepository.find();
    const projects2 = orchestrator.listProjects();
    return projects2;
  }
};

// src/usecase/listSessionsUseCase.ts
var ListSessionsUseCase = class {
  static async ListSessions() {
    const orchestrator = await OrchestratorRepository.find();
    const sessions2 = orchestrator.listSessions();
    return sessions2;
  }
};

// src/index.ts
var projects = await ListProjectsUseCase.listProjects();
console.log("projects");
console.log(projects);
var sessions = await ListSessionsUseCase.ListSessions();
console.log("sessions");
console.log(sessions);
await createFollowupMessageUseCase.sendMessage("double the previous value you returned", sessions[0].claudeCodeSessionId);
var messages = await ListMessagesUseCase.listMesseges(sessions[0].claudeCodeSessionId);
console.log("messages");
console.log(messages);
console.log("lazystarforge");
//# sourceMappingURL=index.js.map