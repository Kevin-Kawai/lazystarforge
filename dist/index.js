#!/usr/bin/env node

// src/index.ts
import blessed from "neo-blessed";

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
  constructor(status = "idle" /* IDLE */, worktree, project, claudeCodeSessionId, messages = []) {
    this.status = status;
    this.worktree = worktree;
    this.project = project;
    this.claudeCodeSessionId = claudeCodeSessionId;
    this.messages = messages;
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
      const messages = this.parseMessages(json["messages"]);
      return new Session(status, json["worktree"], project, json["claudeCodeSessionId"], messages);
    });
    return new SessionManager(sessions2);
  }
  parseSessionStatus(input2) {
    if (Object.values(ESessionStatus).includes(input2)) {
      return input2;
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
  parseMessenger(input2) {
    if (Object.values(EMessenger).includes(input2)) {
      return input2;
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
  static async persistSessions(sessions2) {
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

// src/usecase/listMessagesUseCase.ts
var ListMessagesUseCase = class {
  static async listMesseges(sessionId) {
    const orchestrator = await OrchestratorRepository.find();
    const session = orchestrator.listSessions().find((session2) => {
      return session2.claudeCodeSessionId === sessionId;
    });
    if (session === void 0) throw new Error("invalid session");
    return orchestrator.listMessages(session);
  }
};

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

// src/index.ts
var projects = await ListProjectsUseCase.listProjects();
var sessions = await ListSessionsUseCase.ListSessions();
var selectedProjectName = projects[0].name;
var filteredSessions = sessions.filter((s) => s.project.name === selectedProjectName);
var selectedSessionId = filteredSessions[0].claudeCodeSessionId;
var screen = blessed.screen({ smartCSR: true, title: "Lazy StarForge (POC)" });
var header = blessed.box({
  parent: screen,
  top: 0,
  left: 0,
  height: 1,
  width: "100%",
  tags: true,
  content: "{bold}Lazy StarForge{/bold} (q quit, n new, j/k move, Enter Select, type below + Enter)"
});
var projectsList = blessed.list({
  parent: screen,
  top: 1,
  left: 0,
  width: "30%-1",
  height: "30%",
  border: "line",
  label: "Projects ",
  keys: true,
  mouse: true,
  vi: true,
  style: { selected: { inverse: true } },
  items: projects.map((project) => project.name)
});
var sessionsList = blessed.list({
  parent: screen,
  top: "30%",
  left: 0,
  width: "30%-1",
  height: "30%",
  border: "line",
  label: "Sessions ",
  keys: true,
  mouse: true,
  vi: true,
  style: { selected: { inverse: true } },
  items: filteredSessions.map((s) => s.claudeCodeSessionId)
});
var transcript = blessed.box({
  parent: screen,
  top: 1,
  left: "30%-1",
  width: "70%+1",
  height: "100%-4",
  border: "line",
  label: " Transcript ",
  tags: true,
  scrollable: true,
  alwaysScroll: true,
  keys: true,
  mouse: true,
  vi: true,
  scrollbar: { ch: " ", style: { inverse: true } }
});
var input = blessed.textbox({
  parent: screen,
  bottom: 0,
  left: 0,
  width: "100%",
  height: 3,
  border: "line",
  label: "Input ",
  inputOnFocus: true,
  keys: true,
  mouse: true
});
function setSessionListFromSessions(list) {
  filteredSessions = list;
  if (list.length === 0) {
    sessionsList.setItems(["(sessions)"]);
    sessionsList.select(0);
    sessionsList.style.fg = "gray";
    selectedSessionId = null;
    return;
  }
  sessionsList.setItems(list.map((s) => s.claudeCodeSessionId));
  sessionsList.select(0);
  sessionsList.style.fg = void 0;
  selectedSessionId = list[0].claudeCodeSessionId;
}
function setTranscriptContent(messageThread) {
  transcript.setContent(messageThread);
  transcript.setScrollPerc(100);
}
async function refreshMessagesForSelectedSession() {
  if (selectedSessionId === null) {
    transcript.setContent("");
    transcript.setScrollPerc(100);
    return;
  }
  const messages = await ListMessagesUseCase.listMesseges(selectedSessionId);
  const messageThread = messages.reduce((acc, message) => {
    return acc.concat(message.messenger + "\n" + message.content + "\n\n");
  }, "");
  setTranscriptContent(messageThread);
  screen.render();
}
async function refreshSessionsForSelectedProject() {
  const allSessions = await ListSessionsUseCase.ListSessions();
  const filtered = allSessions.filter((s) => s.project.name === selectedProjectName);
  setSessionListFromSessions(filtered);
  screen.render();
}
projectsList.focus();
projectsList.on("select item", async (_item, index) => {
  selectedProjectName = projects[index]?.name ?? selectedProjectName;
  await refreshSessionsForSelectedProject();
  await refreshMessagesForSelectedSession();
});
input.on("submit", async (value) => {
  const text = (value ?? "").trim();
  input.clearValue();
  if (!text) return;
  if (selectedSessionId === null) return;
  await createFollowupMessageUseCase.sendMessage(text, selectedSessionId);
  screen.render();
});
sessionsList.on("select item", async (_item, index) => {
  if (filteredSessions.length === 0) return;
  selectedSessionId = filteredSessions[index]?.claudeCodeSessionId ?? null;
  await refreshMessagesForSelectedSession();
});
transcript.key("j", () => {
  transcript.scroll(1);
  screen.render();
});
transcript.key("k", () => {
  transcript.scroll(-1);
  screen.render();
});
sessionsList.key("enter", () => {
  transcript.focus();
  screen.render();
});
transcript.key("tab", () => {
  input.focus();
  input.readInput();
  screen.render();
});
await refreshMessagesForSelectedSession();
screen.key(["q", "C-c"], () => process.exit(0));
projectsList.key(["tab"], () => {
  if (screen.focused === projectsList) sessionsList.focus();
  else projectsList.focus();
});
sessionsList.key(["tab"], () => {
  if (screen.focused === projectsList) sessionsList.focus();
  else projectsList.focus();
});
screen.render();
//# sourceMappingURL=index.js.map