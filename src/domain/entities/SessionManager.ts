import { ISession } from "./Session"

export interface ISessionManager {
  sessions: ISession[],
  listSessions(): ISession[],
  addSession(session: ISession): void
}

export class SessionManager implements ISessionManager {
  sessions: ISession[]

  constructor() {
    this.sessions = []
  }

  addSession(session: ISession): void {
    this.sessions.push(session)
  }

  listSessions(): ISession[] {
    return this.sessions
  }
}
