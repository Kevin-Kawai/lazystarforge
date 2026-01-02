#!/usr/bin/env node

import { CreateProjectUseCase } from "./usecase/createProjectUseCase.ts"
import { CreateSessionUseCase } from "./usecase/createSessionUseCase.js"
import { SendMessageUseCase } from "./usecase/sendMessageUseCase.js"
import { normalizeCwd } from "./utils/normalizeCwd.ts"

const projectPath = normalizeCwd("~/Projects/jbeat-games/")
const project = await CreateProjectUseCase.createProject("jbeat-games", projectPath)
const session = await CreateSessionUseCase.createSession("test_worktree", project)

await SendMessageUseCase.sendMessage("using the notion mcp, what's the title of this page https://www.notion.so/LazyStarForge-Initial-POC-2d1227e94f6180e999e2c6d5f2ea025d", session)

session.messages.forEach((message) => {
  console.log(message)
})

console.log("lazystarforge")
