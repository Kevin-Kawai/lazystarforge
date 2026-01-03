#!/usr/bin/env node

import { createFollowupMessageUseCase } from "./usecase/createFollowupMessageUseCase.ts";
import { CreateProjectUseCase } from "./usecase/createProjectUseCase.ts";
import { CreateSessionUseCase } from "./usecase/createSessionUseCase.ts";
import { ListMessagesUseCase } from "./usecase/listMessagesUseCase.ts";
import { ListProjectsUseCase } from "./usecase/listProjectsUseCase.ts";
import { ListSessionsUseCase } from "./usecase/listSessionsUseCase.ts";

// await CreateProjectUseCase.createProject("another-teste", "~/Projects/jbeat-games/")
const projects = await ListProjectsUseCase.listProjects()

// await CreateSessionUseCase.createSession(projects[0].name, "what is the current working directory")
const sessions = await ListSessionsUseCase.ListSessions(projects[0].name)

await createFollowupMessageUseCase.sendMessage("double the result of the last value I had you calculate", projects[0].name, sessions[0].claudeCodeSessionId)

const messages = await ListMessagesUseCase.listMessages(projects[0].name, sessions[0].claudeCodeSessionId)

console.log("messages")
console.log(messages)


