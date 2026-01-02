#!/usr/bin/env node

// src/domain/entities/Project.ts
var Project = class {
  name;
  path;
  constructor(path2, name) {
    this.path = path2;
    this.name = name;
  }
};

// src/usecase/createProjectUseCase.ts
var CreateProjectUseCase = class {
  static async createProject(name, path2) {
    const project2 = new Project(path2, name);
    return project2;
  }
};

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
  worktree;
  project;
  messages;
  constructor(worktree, project2) {
    this.status = "idle" /* IDLE */;
    this.worktree = worktree;
    this.project = project2;
    this.messages = [];
  }
  sendMessage(message) {
    this.messages.push(message);
  }
  manualTakeover() {
  }
};

// src/usecase/createSessionUseCase.ts
var CreateSessionUseCase = class {
  static async createSession(worktree, project2) {
    const session2 = new Session(worktree, project2);
    return session2;
  }
};

// src/gateway/ClaudeCodeGateway.ts
import { query } from "@anthropic-ai/claude-agent-sdk";
var ClaudeCodeGateway = class {
  static async *streamMessage(session2, content) {
    for await (const message of query({
      prompt: content,
      options: {
        cwd: session2.project.path
      }
    })) {
      if (message.type === "assistant" && message.message?.content) {
        for (const block of message.message.content) {
          if ("text" in block) yield { type: "assistant_text", text: block.text };
          else if ("name" in block) yield { type: "tool_call", name: block.name };
        }
      } else if (message.type === "result") {
        yield { type: "done", subtype: message.subtype };
      }
    }
  }
};

// src/usecase/sendMessageUseCase.ts
var SendMessageUseCase = class {
  static async sendMessage(message, session2) {
    const userMessage = new Message({ messenger: "user" /* USER */, content: message });
    session2.sendMessage(userMessage);
    session2.status = "active" /* ACTIVE */;
    for await (const event of ClaudeCodeGateway.streamMessage(session2, message)) {
      if (event.type === "assistant_text") {
        const systemMessage = new Message({ messenger: "system" /* SYSTEM */, content: event.text });
        session2.sendMessage(systemMessage);
      }
      if (event.type === "done") session2.status = "idle" /* IDLE */;
    }
  }
};

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

// src/index.ts
var projectPath = normalizeCwd("~/Projects/jbeat-games/");
var project = await CreateProjectUseCase.createProject("jbeat-games", projectPath);
var session = await CreateSessionUseCase.createSession("test_worktree", project);
await SendMessageUseCase.sendMessage("using the notion mcp, what's the title of this page https://www.notion.so/LazyStarForge-Initial-POC-2d1227e94f6180e999e2c6d5f2ea025d", session);
session.messages.forEach((message) => {
  console.log(message);
});
console.log("lazystarforge");
//# sourceMappingURL=index.js.map