#!/usr/bin/env node

import { createFollowupMessageUseCase } from "./usecase/createFollowupMessageUseCase.ts"
import { ListMessagesUseCase } from "./usecase/listMessagesUseCase.ts"
import { ListProjectsUseCase } from "./usecase/listProjectsUseCase.ts"
import { ListSessionsUseCase } from "./usecase/listSessionsUseCase.ts"

const projects = await ListProjectsUseCase.listProjects()
console.log("projects")
console.log(projects)

const sessions = await ListSessionsUseCase.ListSessions()
console.log("sessions")
console.log(sessions)

await createFollowupMessageUseCase.sendMessage("double the previous value you returned", sessions[0].claudeCodeSessionId)
const messages = await ListMessagesUseCase.listMesseges(sessions[0].claudeCodeSessionId)
console.log("messages")
console.log(messages)

console.log("lazystarforge")
