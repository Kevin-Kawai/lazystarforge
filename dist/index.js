#!/usr/bin/env node

// src/gateway/ClaudeCodeGateway.ts
import { query } from "@anthropic-ai/claude-agent-sdk";
var ClaudeCodeGateway = class {
  static async *streamMessage(path3, content, sessionId) {
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

// src/repository/projectRepository.ts
import { promises as fs2 } from "fs";
import { readdir, readFile } from "fs/promises";

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

// src/repository/projectRepository.ts
import path2 from "path";

// src/domain/entities/Message.ts
var Message = class {
  messenger;
  content;
  constructor({ messenger, content }) {
    this.messenger = messenger;
    this.content = content;
  }
};

// src/domain/entities/Session.ts
var Session = class {
  status;
  updated;
  project;
  messages;
  claudeCodeSessionId;
  constructor(project, claudeCodeSessionId, status = "idle" /* IDLE */, messages2 = []) {
    this.status = status;
    this.project = project;
    this.claudeCodeSessionId = claudeCodeSessionId;
    this.messages = messages2;
    this.updated = false;
  }
  sendUserMessage(content) {
    const messenger = "user" /* USER */;
    const message = new Message({ messenger, content });
    this.messages.push(message);
  }
  sendAssistantMessage(content) {
    const messenger = "system" /* SYSTEM */;
    const message = new Message({ messenger, content });
    this.messages.push(message);
  }
};

// src/domain/entities/Project.ts
var Project = class {
  name;
  path;
  sessions;
  constructor(path3, name, sessions2 = []) {
    this.path = path3;
    this.name = name;
    this.sessions = sessions2;
  }
  startSession(claudeCodeSessionId, message) {
    const session = new Session(this, claudeCodeSessionId, "idle" /* IDLE */);
    session.sendUserMessage(message);
    this.sessions.push(session);
  }
  sendUserMessage(content, sessionId) {
    const session = this.sessions.find((session2) => {
      return session2.claudeCodeSessionId === sessionId;
    });
    if (session === void 0) return;
    session.sendUserMessage(content);
  }
  sendAssistantMessage(content, sessionId) {
    const session = this.sessions.find((session2) => {
      return session2.claudeCodeSessionId === sessionId;
    });
    if (session === void 0) return;
    session.sendAssistantMessage(content);
  }
  viewMessages(sessionId) {
    const session = this.sessions.find((session2) => {
      return session2.claudeCodeSessionId === sessionId;
    });
    if (session === void 0) return [];
    return session.messages;
  }
};

// src/factory/projectFactory.ts
var ProjectFactory = class {
  projectJson;
  constructor(projectJson) {
    this.projectJson = projectJson;
  }
  generate() {
    const project = new Project(this.projectJson["path"], this.projectJson["name"]);
    const sessions2 = this.projectJson["sessions"].map((sessionJson) => {
      const session = new Session(
        project,
        sessionJson["claudeCodeSessionId"],
        sessionJson["status"],
        sessionJson["messages"]?.map((message) => {
          return new Message({ messenger: message["messenger"], content: message["content"] });
        }) ?? []
      );
      session.updated = Boolean(sessionJson["updated"]);
      return session;
    });
    project.sessions = sessions2;
    return project;
  }
};

// src/repository/projectRepository.ts
var filePath = normalizeCwd("~/.lazystarforge/data");
var ProjectRepository = class {
  static async findAll() {
    const projectsJson = await this.readProjects();
    const hydrated = await Promise.all(projectsJson.map((p) => this.retrieveSessions(p)));
    return hydrated.map((projectsJson2) => {
      const projectFactory = new ProjectFactory(projectsJson2);
      return projectFactory.generate();
    });
  }
  static async readProjects() {
    const entries = await readdir(filePath + "/projects", { withFileTypes: true });
    const jsonFiles = entries.filter((e) => e.isFile() && e.name.toLowerCase().endsWith(".json")).map((e) => path2.join(filePath + "/projects", e.name));
    const results = await Promise.all(
      jsonFiles.map(async (filePath2) => {
        const text = await readFile(filePath2, "utf8");
        return JSON.parse(text);
      })
    );
    return results;
  }
  static async find(projectName) {
    const rawProject = await fs2.readFile(filePath + `/projects/${projectName}.json`, "utf8");
    const parsedProject = JSON.parse(rawProject);
    const projectJson = await this.retrieveSessions(parsedProject);
    const projectFactory = new ProjectFactory(projectJson);
    const project = projectFactory.generate();
    return project;
  }
  static async retrieveSessions(project) {
    const sessions2 = await Promise.all(
      project.sessions.map(async (sessionId) => {
        const text = await fs2.readFile(filePath + `/sessions/${sessionId}.json`, "utf8");
        return JSON.parse(text);
      })
    );
    return {
      ...project,
      sessions: sessions2
    };
  }
  static async save(project) {
    await fs2.mkdir(filePath + "/sessions", { recursive: true });
    await fs2.mkdir(filePath + "/projects", { recursive: true });
    await Promise.all(
      project.sessions.map(async (session) => {
        const sessionJson = JSON.stringify(await this.convertSessionToJson(session), null, 2);
        await fs2.writeFile(filePath + `/sessions/${session.claudeCodeSessionId}.json`, sessionJson, "utf8");
      })
    );
    const projectJson = JSON.stringify(await this.convertProjectToJson(project));
    await fs2.writeFile(filePath + `/projects/${project.name}.json`, projectJson, "utf8");
  }
  static async convertProjectToJson(project) {
    return {
      path: project.path,
      name: project.name,
      sessions: project.sessions.map((session) => session.claudeCodeSessionId)
    };
  }
  static async convertSessionToJson(session) {
    return {
      claudeCodeSessionId: session.claudeCodeSessionId,
      status: session.status,
      updated: session.updated,
      project: session.project.name,
      messages: session.messages.map((message) => ({
        messenger: message.messenger,
        content: message.content
      }))
    };
  }
};

// src/usecase/createFollowupMessageUseCase.ts
var createFollowupMessageUseCase = class {
  static async sendMessage(userMessage, projectName, sessionId) {
    const project = await ProjectRepository.find(projectName);
    project.sendUserMessage(userMessage, sessionId);
    for await (const event of ClaudeCodeGateway.streamMessage(project.path, userMessage, sessionId)) {
      if (event.type === "assistant_text") {
        project.sendAssistantMessage(event.text, event.sessionId);
      }
    }
    await ProjectRepository.save(project);
  }
};

// src/usecase/listMessagesUseCase.ts
var ListMessagesUseCase = class {
  static async listMessages(projectName, sessionId) {
    const project = await ProjectRepository.find(projectName);
    return project.viewMessages(sessionId);
  }
};

// src/usecase/listProjectsUseCase.ts
var ListProjectsUseCase = class {
  static async listProjects() {
    const projects2 = await ProjectRepository.findAll();
    return projects2;
  }
};

// src/usecase/listSessionsUseCase.ts
var ListSessionsUseCase = class {
  static async ListSessions(projectName) {
    const project = await ProjectRepository.find(projectName);
    return project.sessions;
  }
};

// src/index.ts
var projects = await ListProjectsUseCase.listProjects();
var sessions = await ListSessionsUseCase.ListSessions(projects[0].name);
await createFollowupMessageUseCase.sendMessage("double the result of the last value I had you calculate", projects[0].name, sessions[0].claudeCodeSessionId);
var messages = await ListMessagesUseCase.listMessages(projects[0].name, sessions[0].claudeCodeSessionId);
console.log("messages");
console.log(messages);
//# sourceMappingURL=index.js.map