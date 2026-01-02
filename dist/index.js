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

// src/domain/entities/Project.ts
var Project = class {
  name;
  path;
  constructor(path2, name) {
    this.path = path2;
    this.name = name;
  }
};

// src/domain/entities/ProjectManager.ts
var ProjectManager = class {
  projects;
  constructor(projects = []) {
    this.projects = projects;
  }
  addProject(project2) {
    this.projects.push(project2);
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
  messages;
  constructor(status = "idle" /* IDLE */, worktree, project2, messages = []) {
    this.status = status;
    this.worktree = worktree;
    this.project = project2;
    this.messages = messages;
  }
  sendMessage(message) {
    this.messages.push(message);
  }
  manualTakeover() {
  }
};

// src/domain/entities/SessionManager.ts
var SessionManager = class {
  sessions;
  constructor(sessions = []) {
    this.sessions = sessions;
  }
  addSession(session2) {
    this.sessions.push(session2);
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
    const project2 = new Project(...args);
    this.projectManager.addProject(project2);
  }
  listProjects() {
    return this.projectManager.listProjects();
  }
  newSession(...args) {
    const session2 = new Session("idle" /* IDLE */, ...args);
    this.sessionManager.addSession(session2);
  }
  listSessions() {
    return this.sessionManager.listSessions();
  }
  sendMessage(session2, messageContent) {
    const message = new Message({ messenger: "user" /* USER */, content: messageContent });
    session2.sendMessage(message);
  }
  listMessages(session2) {
    return session2.messages;
  }
  takeoverSession(session2) {
    session2.manualTakeover();
  }
};

// src/repository/orchestratorRepository.ts
import { promises as fs2 } from "fs";

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

// src/factory/orchestratorFactory.ts
var OrchestratorFactory = class {
  projectsJson;
  sessionsJson;
  constructor(projects, sessions) {
    this.projectsJson = projects;
    this.sessionsJson = sessions;
  }
  generate() {
    const projects = this.parseProjects(this.projectsJson);
    const sessions = this.parseSessions(this.sessionsJson);
    return new Orchestrator(projects, sessions);
  }
  parseProjects(projectsJson) {
    const projects = projectsJson.map((json) => {
      return new Project(json["path"], json["name"]);
    });
    return new ProjectManager(projects);
  }
  parseSessions(sessionsJson) {
    const sessions = sessionsJson.map((json) => {
      const status = this.parseSessionStatus(json["status"]);
      const project2 = new Project(json["project"]["path"], json["project"]["name"]);
      const messages = this.parseMessages(json["messages"]);
      return new Session(status, json["worktree"], project2, messages);
    });
    return sessions;
  }
  parseSessionStatus(input) {
    if (Object.values(ESessionStatus).includes(input)) {
      return input;
    }
    throw new Error("invalid session status");
  }
  parseMessages(messagesJson) {
    const messages = messagesJson.map((json) => {
      const messenger = this.parseMessenger(json["messenger"]);
      return new Message({ messenger, content: json["content"] });
    });
    return messages;
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
    const rawSessions = await fs2.readFile(filePath + "/sessions.json", "utf8");
    const projects = JSON.parse(rawProjects);
    const sessions = JSON.parse(rawSessions);
    const orchestratorFactory = new OrchestratorFactory(projects, sessions);
    const orchestrator2 = orchestratorFactory.generate();
    return orchestrator2;
  }
  static async save(orchestrator2) {
    const projectsJson = await this.convertOrchestratorProjectsToJson(orchestrator2.listProjects());
    const sessionsJson = await this.convertOrchestratorSessionsToJson(orchestrator2.listSessions());
    await fs2.writeFile(filePath + "/projects.json", projectsJson, "utf8");
    await fs2.writeFile(filePath + "/sessions.json", sessionsJson, "utf8");
  }
  static async convertOrchestratorProjectsToJson(projects) {
    return JSON.stringify(projects, null, 2);
  }
  static async convertOrchestratorSessionsToJson(sessions) {
    return JSON.stringify(sessions, null, 2);
  }
};

// src/gateway/ClaudeCodeGateway.ts
import { query } from "@anthropic-ai/claude-agent-sdk";

// src/index.ts
var projectPath = normalizeCwd("~/Projects/jbeat-games/");
var orchestrator = new Orchestrator();
orchestrator.newProject("./projects/test", "test");
var project = orchestrator.listProjects()[0];
orchestrator.newSession("refactor_home_page", project);
var session = orchestrator.listSessions()[0];
orchestrator.sendMessage(session, "test message");
console.log("saving orchestrator");
await OrchestratorRepository.save(orchestrator);
console.log("finding orchestrator");
var orchestratorNew = await OrchestratorRepository.find();
console.log(orchestratorNew);
console.log("lazystarforge");
//# sourceMappingURL=index.js.map