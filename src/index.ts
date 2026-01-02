#!/usr/bin/env node

import { CreateProjectUseCase } from "./usecase/createProjectUseCase.ts"
import { CreateSessionUseCase } from "./usecase/createSessionUseCase.ts"
import { ListProjectsUseCase } from "./usecase/listProjectsUseCase.ts"

await CreateProjectUseCase.createProject("test", "~/Projects/jbeat-games/")
const projects = await ListProjectsUseCase.listProjects()
console.log("projects")
console.log(projects)

await CreateSessionUseCase.createSession("refactor", "test")
const sessions = await ListProjectsUseCase.listProjects()
console.log("sessions")
console.log(sessions)

console.log("lazystarforge")
