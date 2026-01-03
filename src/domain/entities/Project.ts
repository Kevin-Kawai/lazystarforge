import type { IMessage } from "./Message.ts"
import { ESessionStatus, Session, type ISession } from "./Session.ts"

export interface IProject {
  name: string
  path: string
  sessions: ISession[]
  startSession(claudeCodeSessionId: string): void
  sendMessage(content: string, sessionId: string): void
  viewMessages(sessionId: string): IMessage[]
}

export class Project implements IProject {
  name: string
  path: string
  sessions: ISession[]

  constructor(path: string, name: string, sessions: ISession[] = []) {
    this.path = path
    this.name = name
    this.sessions = sessions
  }

  startSession(claudeCodeSessionId: string): void {
    const session = new Session(ESessionStatus.IDLE, this, claudeCodeSessionId)
    this.sessions.push(session)
  }

  sendMessage(content: string, sessionId: string): void {
    const session = this.sessions.find((session) => {
      return session.claudeCodeSessionId === sessionId
    })

    if (session === undefined) return
    session.sendUserMessage(content)
  }

  viewMessages(sessionId: string): IMessage[] {
    const session = this.sessions.find((session) => {
      return session.claudeCodeSessionId === sessionId
    })

    if (session === undefined) return []
    return session.messages
  }
}
