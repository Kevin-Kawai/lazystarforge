import type { IMessage } from "./Message.ts"
import { ESessionStatus, Session, type ISession } from "./Session.ts"

export interface IProject {
  name: string
  path: string
  sessions: ISession[]
  startSession(claudeCodeSessionId: string, sessionName: string, message: string): void
  addSession(session: ISession): void
  deleteSession(sessionId: string): void
  sendUserMessage(content: string, sessionId: string): void
  sendAssistantMessage(content: string, sessionId: string): void
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

  startSession(claudeCodeSessionId: string, sessionName: string, message: string): void {
    const session = new Session(this, claudeCodeSessionId, sessionName, ESessionStatus.IDLE)
    session.sendUserMessage(message)
    this.sessions.push(session)
  }

  addSession(session: ISession): void {
    this.sessions.push(session)
  }

  deleteSession(sessionId: string): void {
    const index = this.sessions.findIndex((session) => {
      return session.claudeCodeSessionId === sessionId
    })

    if (index !== -1) {
      this.sessions.splice(index, 1)
    }
  }

  sendUserMessage(content: string, sessionId: string): void {
    const session = this.sessions.find((session) => {
      return session.claudeCodeSessionId === sessionId
    })

    if (session === undefined) return
    session.sendUserMessage(content)
  }

  sendAssistantMessage(content: string, sessionId: string): void {
    const session = this.sessions.find((session) => {
      return session.claudeCodeSessionId === sessionId
    })

    if (session === undefined) return
    session.sendAssistantMessage(content)
  }

  viewMessages(sessionId: string): IMessage[] {
    const session = this.sessions.find((session) => {
      return session.claudeCodeSessionId === sessionId
    })

    if (session === undefined) return []
    return session.messages
  }
}
