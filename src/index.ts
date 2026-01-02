#!/usr/bin/env node

import { Orchestrator } from "./domain/entities/Orchestrator.ts"
import { OrchestratorRepository } from "./repository/orchestratorRepository.ts"
import { normalizeCwd } from "./utils/normalizeCwd.ts"

const projectPath = normalizeCwd("~/Projects/jbeat-games/")

const orchestrator = new Orchestrator
orchestrator.newProject("./projects/test", "test")
const project = orchestrator.listProjects()[0]
orchestrator.newSession('refactor_home_page', project)
const session = orchestrator.listSessions()[0]
orchestrator.sendMessage(session, 'test message')

console.log("saving orchestrator")
await OrchestratorRepository.save(orchestrator)

console.log("finding orchestrator")
const orchestratorNew = await OrchestratorRepository.find()
console.log(orchestratorNew)

console.log("lazystarforge")
