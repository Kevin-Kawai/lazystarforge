#!/usr/bin/env node

// src/index.ts
import blessed from "neo-blessed";

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
  constructor(project, claudeCodeSessionId, status = "idle" /* IDLE */, messages = []) {
    this.status = status;
    this.project = project;
    this.claudeCodeSessionId = claudeCodeSessionId;
    this.messages = messages;
    this.updated = false;
  }
  sendUserMessage(content) {
    const messenger = "user" /* USER */;
    const message2 = new Message({ messenger, content });
    this.messages.push(message2);
  }
  sendAssistantMessage(content) {
    const messenger = "system" /* SYSTEM */;
    const message2 = new Message({ messenger, content });
    this.messages.push(message2);
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
  startSession(claudeCodeSessionId, message2) {
    const session = new Session(this, claudeCodeSessionId, "idle" /* IDLE */);
    session.sendUserMessage(message2);
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
        sessionJson["messages"]?.map((message2) => {
          return new Message({ messenger: message2["messenger"], content: message2["content"] });
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
      messages: session.messages.map((message2) => ({
        messenger: message2.messenger,
        content: message2.content
      }))
    };
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

// src/usecase/listMessagesUseCase.ts
var ListMessagesUseCase = class {
  static async listMessages(projectName, sessionId) {
    const project = await ProjectRepository.find(projectName);
    return project.viewMessages(sessionId);
  }
};

// src/gateway/ClaudeCodeGateway.ts
import { query } from "@anthropic-ai/claude-agent-sdk";
var ClaudeCodeGateway = class {
  static async *streamMessage(path3, content, sessionId) {
    for await (const message2 of query({
      prompt: content,
      options: {
        cwd: path3,
        resume: sessionId
      }
    })) {
      if (message2.type === "assistant" && message2.message?.content) {
        for (const block of message2.message.content) {
          if ("text" in block) yield { type: "assistant_text", text: block.text, sessionId: message2.session_id };
          else if ("name" in block) yield { type: "tool_call", name: block.name };
        }
      } else if (message2.type === "result") {
        yield { type: "done", subtype: message2.subtype };
      }
    }
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

// src/usecase/createSessionUseCase.ts
var CreateSessionUseCase = class {
  static async createSession(projectName, userMessage) {
    const project = await ProjectRepository.find(projectName);
    let initialMessage = true;
    for await (const event of ClaudeCodeGateway.streamMessage(project.path, userMessage)) {
      if (event.type === "assistant_text") {
        if (initialMessage) {
          project.startSession(event.sessionId, userMessage);
          initialMessage = false;
        }
        project.sendAssistantMessage(event.text, event.sessionId);
      }
    }
    await ProjectRepository.save(project);
  }
};

// src/usecase/createProjectUseCase.ts
var CreateProjectUseCase = class {
  static async createProject(name, path3) {
    const normalizedPath = normalizeCwd(path3);
    const project = new Project(normalizedPath, name);
    await ProjectRepository.save(project);
  }
};

// src/index.ts
var projects = await ListProjectsUseCase.listProjects();
var sessions = await ListSessionsUseCase.ListSessions(projects[0].name);
var message = await ListMessagesUseCase.listMessages(projects[0].name, sessions[0].claudeCodeSessionId);
var selectedProjectName = projects[0].name;
var selectedSessionId = sessions[0].claudeCodeSessionId;
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
  items: sessions.map((s) => s.claudeCodeSessionId)
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
  const messages = await ListMessagesUseCase.listMessages(selectedProjectName, selectedSessionId);
  const messageThread = messages.reduce((acc, message2) => {
    return acc.concat(message2.messenger + "\n" + message2.content + "\n\n");
  }, "");
  setTranscriptContent(messageThread);
  screen.render();
}
function setSessionListFromSessions(list) {
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
async function refreshSessionsForSelectedProject() {
  if (selectedSessionId === null) return;
  const allSessions = await ListSessionsUseCase.ListSessions(selectedProjectName);
  const filtered = allSessions.filter((s) => s.project.name === selectedProjectName);
  setSessionListFromSessions(filtered);
  screen.render();
}
projectsList.focus();
projectsList.on("select item", async (item, index) => {
  selectedProjectName = item.getText();
  await refreshSessionsForSelectedProject();
  await refreshMessagesForSelectedSession();
});
await refreshMessagesForSelectedSession();
projectsList.key(["tab"], () => {
  if (screen.focused === projectsList) sessionsList.focus();
  else projectsList.focus();
});
sessionsList.key(["tab"], () => {
  if (screen.focused === projectsList) sessionsList.focus();
  else projectsList.focus();
});
sessionsList.on("select item", async (item, index) => {
  selectedSessionId = item.getText();
  await refreshMessagesForSelectedSession();
  screen.render();
});
transcript.key("j", () => {
  transcript.scroll(1);
  screen.render();
});
transcript.key("k", () => {
  transcript.scroll(-1);
  screen.render();
});
transcript.key("tab", () => {
  input.focus();
  input.readInput();
  screen.render();
});
input.on("submit", async (value) => {
  const text = (value ?? "").trim();
  input.clearValue();
  if (!text) return;
  if (selectedSessionId === null) return;
  await createFollowupMessageUseCase.sendMessage(text, selectedProjectName, selectedSessionId);
  await refreshMessagesForSelectedSession();
  screen.render();
});
function focusPreviousFromInput() {
  transcript.focus();
  screen.render();
}
input.key(["S-tab", "backtab"], () => {
  input.cancel();
  focusPreviousFromInput();
});
function openNewSessionPrompt() {
  const modal = blessed.box({
    parent: screen,
    top: "center",
    left: "center",
    width: "60%",
    height: 7,
    border: "line",
    label: " New session ",
    tags: true,
    style: { border: { fg: "cyan" } }
  });
  blessed.box({
    parent: modal,
    top: 1,
    left: 1,
    height: 1,
    content: "Enter initial message (Esc to cancel)"
  });
  const prompt = blessed.textbox({
    parent: modal,
    top: 3,
    left: 1,
    width: "100%-3",
    height: 3,
    border: "line",
    inputOnFocus: true,
    keys: true,
    mouse: true
  });
  const close = () => {
    prompt.cancel();
    modal.detach();
    sessionsList.focus();
    screen.render();
  };
  prompt.key("escape", close);
  prompt.on("submit", async (value) => {
    const text = (value ?? "").trim();
    if (!text) return close();
    await CreateSessionUseCase.createSession(selectedProjectName, text);
    await refreshSessionsForSelectedProject();
    await refreshMessagesForSelectedSession();
    close();
  });
  prompt.focus();
  prompt.readInput();
  screen.render();
}
sessionsList.key("n", () => {
  openNewSessionPrompt();
});
function openNewProjectPrompt() {
  const modal = blessed.box({
    parent: screen,
    top: "center",
    left: "center",
    width: "70%",
    height: 11,
    border: "line",
    label: " New project ",
    tags: true,
    style: { border: { fg: "cyan " } }
  });
  blessed.box({
    parent: modal,
    top: 1,
    left: 1,
    height: 1,
    content: "Project name:"
  });
  const nameInput = blessed.textbox({
    parent: modal,
    top: 2,
    left: 1,
    width: "100%-3",
    height: 3,
    border: "line",
    inputOnFocus: true,
    keys: true,
    mouse: true
  });
  blessed.box({
    parent: modal,
    top: 5,
    left: 1,
    height: 1,
    content: "Project path:"
  });
  const pathInput = blessed.textbox({
    parent: modal,
    top: 6,
    left: 1,
    width: "100%-3",
    height: 3,
    border: "line",
    inputOnFocus: true,
    keys: true,
    mouse: true
  });
  const close = () => {
    nameInput.cancel();
    pathInput.cancel();
    modal.detach();
    projectsList.focus();
    screen.render();
  };
  nameInput.key("escape", close);
  pathInput.key("escape", close);
  nameInput.on("submit", (value) => {
    const name = (value ?? "").trim();
    if (!name) return;
    pathInput.focus();
    pathInput.readInput();
    screen.render();
  });
  pathInput.key(["S-tab", "backtab"], () => {
    pathInput.cancel();
    nameInput.focus();
    nameInput.readInput();
    screen.render();
  });
  pathInput.on("submit", async (value) => {
    const name = (nameInput.getValue() ?? "").trim();
    const p = (value ?? "").trim();
    if (!name || !p) return close();
    try {
      await CreateProjectUseCase.createProject(name, p);
      const updatedProjects = await ListProjectsUseCase.listProjects();
      projectsList.setItems(updatedProjects.map((pr) => pr.name));
      projectsList.select(0);
      selectedProjectName = updatedProjects[0]?.name ?? selectedProjectName;
      await refreshSessionsForSelectedProject();
      await refreshMessagesForSelectedSession();
    } finally {
      close();
    }
  });
  nameInput.focus();
  nameInput.readInput();
  screen.render();
}
projectsList.key("p", () => {
  openNewProjectPrompt();
});
screen.key(["q", "C-c"], () => process.exit(0));
screen.render();
//# sourceMappingURL=index.js.map