import { promises as fs } from "node:fs"
import type { ISession } from "../domain/entities/Session.ts";
import { normalizeCwd } from "../utils/normalizeCwd.ts";

const filePath = normalizeCwd("~/.lazystarforge/data")

export class SessionRepository {
  static async save(session: ISession) {
    await fs.mkdir(filePath + "/sessions", { recursive: true })
    const sessionJson = JSON.stringify(await this.convertSessionToJson(session), null, 2)
    await fs.writeFile(filePath + `/sessions/${session.claudeCodeSessionId}.json`, sessionJson, "utf8")
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
