import { promises as fs, writeFile } from "node:fs"
import { readdir, readFile } from "node:fs/promises"
import { normalizeCwd } from "../utils/normalizeCwd.ts";
import path from "node:path"
import { ProjectFactory } from "../factory/projectFactory.ts";
import type { IProject } from "../domain/entities/Project.ts";
import type { ISession } from "../domain/entities/Session.ts";

const filePath = normalizeCwd("~/.lazystarforge/data")

export class ProjectRepository {
  static async findAll() {
    const projectsJson = await this.readProjects()

    const hydrated = await Promise.all(projectsJson.map((p) => this.retrieveSessions(p)))

    return hydrated.map((projectsJson) => {
      const projectFactory = new ProjectFactory(projectsJson)
      return projectFactory.generate()
    })
  }

  private static async readProjects() {
    const entries = await readdir(filePath + "/projects", { withFileTypes: true })

    const jsonFiles = entries
      .filter((e) => e.isFile() && e.name.toLowerCase().endsWith(".json"))
      .map((e) => path.join(filePath + "/projects", e.name))

    const results = await Promise.all(
      jsonFiles.map(async (filePath) => {
        const text = await readFile(filePath, "utf8")
        return JSON.parse(text)
      })
    )

    return results
  }

  static async find(projectName: string) {
    const rawProject = await fs.readFile(filePath + `/projects/${projectName}.json`, "utf8")
    const parsedProject = JSON.parse(rawProject)
    const projectJson = await this.retrieveSessions(parsedProject)

    const projectFactory = new ProjectFactory(projectJson)
    const project = projectFactory.generate()
    return project
  }

  private static async retrieveSessions(project: any) {
    const sessions = await Promise.all(
      project.sessions.map(async (sessionId: string) => {
        const text = await fs.readFile(filePath + `/sessions/${sessionId}.json`, "utf8")
        return JSON.parse(text)
      })
    )

    return {
      ...project,
      sessions
    }
  }

  static async save(project: IProject) {
    await fs.mkdir(filePath + "/sessions", { recursive: true })
    await fs.mkdir(filePath + "/projects", { recursive: true })

    await Promise.all(
      project.sessions.map(async (session) => {
        const sessionJson = JSON.stringify(await this.convertSessionToJson(session), null, 2)
        await fs.writeFile(filePath + `/sessions/${session.claudeCodeSessionId}.json`, sessionJson, "utf8")
      })
    )

    const projectJson = JSON.stringify(await this.convertProjectToJson(project))
    await fs.writeFile(filePath + `/projects/${project.name}.json`, projectJson, "utf8")
  }

  static async convertProjectToJson(project: IProject) {
    return {
      path: project.path,
      name: project.name,
      sessions: project.sessions.map(session => session.claudeCodeSessionId)
    }
  }

  static async convertSessionToJson(session: ISession) {
    return {
      claudeCodeSessionId: session.claudeCodeSessionId,
      status: session.status,
      updated: session.updated,
      project: session.project.name,
      messages: session.messages.map(message => ({
        messenger: message.messenger,
        content: message.content
      }))
    }
  }
}
