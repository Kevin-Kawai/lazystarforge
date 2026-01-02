#!/usr/bin/env node

import { CreateProjectUseCase } from "./usecase/createProjectUseCase.ts"
import { ListProjectsUseCase } from "./usecase/listProjectsUseCase.ts"

await CreateProjectUseCase.createProject("test", "~/Projects/jbeat-games/")
const projects = await ListProjectsUseCase.listProjects()
console.log(projects)

console.log("lazystarforge")
