import { promises as fs } from "node:fs"
import { normalizeCwd } from "../utils/normalizeCwd.ts"
import type { IOrchestrator } from "../domain/entities/Orchestrator.ts"
import type { IProject } from "../domain/entities/Project.ts"
import type { ISession } from "../domain/entities/Session.ts"
import { OrchestratorFactory } from "../factory/orchestratorFactory.ts"

const filePath = normalizeCwd("~/.lazystarforge/data")

export class OrchestratorRepository {
  static async find() {
    const rawProjects = await fs.readFile(filePath + "/projects.json", "utf8")
    const rawSessions = await fs.readFile(filePath + "/sessions.json", "utf8")
    const projects = JSON.parse(rawProjects)
    const sessions = JSON.parse(rawSessions)

    const orchestratorFactory = new OrchestratorFactory(projects, sessions)
    const orchestrator = orchestratorFactory.generate()
    return orchestrator
  }

  static async save(orchestrator: IOrchestrator) {
    const projectsJson = await this.convertOrchestratorProjectsToJson(orchestrator.listProjects())
    const sessionsJson = await this.convertOrchestratorSessionsToJson(orchestrator.listSessions())
    await fs.writeFile(filePath + "/projects.json", projectsJson, "utf8")
    await fs.writeFile(filePath + "/sessions.json", sessionsJson, "utf8")
  }

  private static async convertOrchestratorProjectsToJson(projects: IProject[]) {
    return JSON.stringify(projects, null, 2)
  }

  private static async convertOrchestratorSessionsToJson(sessions: ISession[]) {
    return JSON.stringify(sessions, null, 2)
  }
}
