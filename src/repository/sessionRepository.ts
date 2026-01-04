import { promises as fs } from "node:fs"
import type { ISession } from "../domain/entities/Session.ts";
import { normalizeCwd } from "../utils/normalizeCwd.ts";
import { SessionFactory } from "../factory/sessionFactory.ts";

const filePath = normalizeCwd("~/.lazystarforge/data")

export class SessionRepository {
  static async save(session: ISession) {
    await fs.mkdir(filePath + "/sessions", { recursive: true })
    const sessionJson = JSON.stringify(await this.convertSessionToJson(session), null, 2)
    await fs.writeFile(filePath + `/sessions/${session.claudeCodeSessionId}.json`, sessionJson, "utf8")
  }

  static async find(sessionId: string) {
    const rawSession = await fs.readFile(filePath + `/sessions/${sessionId}.json`, "utf8")
    const parsedSession = JSON.parse(rawSession)
    const sessionJson = await this.retrieveProject(parsedSession)

    const sessionFactory = new SessionFactory(sessionJson)
    const session = sessionFactory.generate()
    return session
  }

  static async delete(sessionId: string) {
    await fs.unlink(filePath + `/sessions/${sessionId}.json`)
  }

  static async retrieveProject(session: any) {
    const projectJson = await fs.readFile(filePath + `/projects/${session["project"]}.json`, "utf8")
    const project = JSON.parse(projectJson)

    return {
      ...session,
      project
    }
  }

  static async convertSessionToJson(session: ISession) {
    return {
      claudeCodeSessionId: session.claudeCodeSessionId,
      status: session.status,
      project: session.project.name,
      messages: session.messages.map(message => ({
        messenger: message.messenger,
        content: message.content
      }))
    }
  }
}
