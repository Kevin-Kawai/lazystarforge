#!/usr/bin/env node

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
  messages;
  constructor(status = "idle" /* IDLE */, worktree, project, messages = []) {
    this.status = status;
    this.worktree = worktree;
    this.project = project;
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
    console.log(this);
    console.log(this.sessionManager);
    return this.sessionManager.listSessions();
  }
  sendMessage(session, messageContent) {
    const message = new Message({ messenger: "user" /* USER */, content: messageContent });
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
  constructor(projects2, sessions) {
    this.projectsJson = projects2;
    this.sessionsJson = sessions;
  }
  generate() {
    const projects2 = this.parseProjects(this.projectsJson);
    const sessions = this.parseSessions(this.sessionsJson);
    return new Orchestrator(projects2, sessions);
  }
  parseProjects(projectsJson) {
    const projects2 = projectsJson.map((json) => {
      return new Project(json["path"], json["name"]);
    });
    return new ProjectManager(projects2);
  }
  parseSessions(sessionsJson) {
    const sessions = sessionsJson.map((json) => {
      const status = this.parseSessionStatus(json["status"]);
      const project = new Project(json["project"]["path"], json["project"]["name"]);
      const messages = this.parseMessages(json["messages"]);
      return new Session(status, json["worktree"], project, messages);
    });
    return new SessionManager(sessions);
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
    const projects2 = JSON.parse(rawProjects);
    const sessions = JSON.parse(rawSessions);
    const orchestratorFactory = new OrchestratorFactory(projects2, sessions);
    const orchestrator = orchestratorFactory.generate();
    return orchestrator;
  }
  static async save(orchestrator) {
    const projectsJson = await this.convertOrchestratorProjectsToJson(orchestrator.listProjects());
    const sessionsJson = await this.convertOrchestratorSessionsToJson(orchestrator.listSessions());
    await fs2.writeFile(filePath + "/projects.json", projectsJson, "utf8");
    await fs2.writeFile(filePath + "/sessions.json", sessionsJson, "utf8");
  }
  static async convertOrchestratorProjectsToJson(projects2) {
    return JSON.stringify(projects2, null, 2);
  }
  static async convertOrchestratorSessionsToJson(sessions) {
    return JSON.stringify(sessions, null, 2);
  }
};

// src/usecase/createProjectUseCase.ts
var CreateProjectUseCase = class {
  static async createProject(name, path2) {
    const normalizedPath = normalizeCwd(path2);
    const orchestrator = await OrchestratorRepository.find();
    orchestrator.newProject(normalizedPath, name);
    await OrchestratorRepository.save(orchestrator);
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

// src/index.ts
await CreateProjectUseCase.createProject("test", "~/Projects/jbeat-games/");
var projects = await ListProjectsUseCase.listProjects();
console.log(projects);
console.log("lazystarforge");
//# sourceMappingURL=index.js.map