import { promises as fs } from "node:fs"
import { readdir, readFile } from "node:fs/promises"
import path from "node:path"
import { normalizeCwd } from "../utils/normalizeCwd.ts"
import type { IOrchestrator } from "../domain/entities/Orchestrator.ts"
import type { IProject } from "../domain/entities/Project.ts"
import type { ISession } from "../domain/entities/Session.ts"
import { OrchestratorFactory } from "../factory/orchestratorFactory.ts"

const filePath = normalizeCwd("~/.lazystarforge/data")

export class OrchestratorRepository {
  static async find() {
    const rawProjects = await fs.readFile(filePath + "/projects.json", "utf8")
    const sessions = await this.readSessions()
    const projects = JSON.parse(rawProjects)

    const orchestratorFactory = new OrchestratorFactory(projects, sessions)
    const orchestrator = orchestratorFactory.generate()
    return orchestrator
  }

  static async save(orchestrator: IOrchestrator) {
    const projectsJson = await this.convertOrchestratorProjectsToJson(orchestrator.listProjects())
    await fs.writeFile(filePath + "/projects.json", projectsJson, "utf8")
    await this.persistSessions(orchestrator.listSessions())
  }

  private static async convertOrchestratorProjectsToJson(projects: IProject[]) {
    return JSON.stringify(projects, null, 2)
  }

  private static async persistSessions(sessions: ISession[]) {
    sessions.forEach(async (session: any) => {
      const sessionJson = JSON.stringify(session, null, 2)
      await fs.writeFile(filePath + `/sessions/${session.claudeCodeSessionId}.json`, sessionJson, "utf8")
    })
  }

  private static async readSessions() {
    const entries = await readdir(filePath + "/sessions", { withFileTypes: true })

    const jsonFiles = entries
      .filter((e) => e.isFile() && e.name.toLowerCase().endsWith(".json"))
      .map((e) => path.join(filePath + "/sessions", e.name))

    const results = await Promise.all(
      jsonFiles.map(async (filePath) => {
        const text = await readFile(filePath, "utf8")
        return JSON.parse(text)
      })
    )

    return results
  }
}
