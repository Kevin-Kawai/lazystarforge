import { promises as fs } from "node:fs"
import path from "node:path"
import type { ISession } from "../domain/entities/Session.ts";
import { SessionFactory } from "../factory/sessionFactory.ts";
import { getDataPath } from "../utils/ensureDataDirectories.ts"

const filePath = getDataPath()

export class SessionRepository {
  static async save(session: ISession) {
    const dir = path.join(filePath, "sessions")
    await fs.mkdir(dir, { recursive: true })

    const sessionJson = JSON.stringify(await this.convertSessionToJson(session), null, 2)
    const finalPath = path.join(dir, `${session.claudeCodeSessionId}.json`)

    const tempPath = await this.writeTempExclusive(dir, `${session.claudeCodeSessionId}.tmp`, sessionJson)
    await fs.rename(tempPath, finalPath)

    // await fs.writeFile(filePath + `/sessions/${session.claudeCodeSessionId}.json`, sessionJson, "utf8")
  }

  static async find(sessionId: string) {
    try {
      const rawSession = await fs.readFile(filePath + `/sessions/${sessionId}.json`, "utf8")
      const parsedSession = JSON.parse(rawSession)
      const sessionJson = await this.retrieveProject(parsedSession)

      const sessionFactory = new SessionFactory(sessionJson)
      const session = sessionFactory.generate()
      return session
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        throw new Error(`Session not found: ${sessionId}`)
      }
      throw error
    }
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

  private static async writeTempExclusive(dir: string, base: string, data: string) {
    for (let attempt = 0; attempt < 50; attempt++) {
      const suffix = `${Date.now()}-${attempt}`
      const temptPath = path.join(filePath, `/sessions/${sessionId}.json`)

      try {
        const fh = await fs.open(temptPath, "wx")
        try {
          await fh.writeFile(data, "utf8")
        } finally {
          await fh.close()
        }
        return temptPath
      } catch (e: any) {
        if (e?.code === "EEXIST") continue
        throw e
      }
    }

    throw new Error("Failed to allocate unique temp file after retries")
  }
}
