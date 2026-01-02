import { type ISession } from "./Session.ts"

export interface ISessionManager {
  sessions: ISession[],
  listSessions(): ISession[],
  addSession(session: ISession): void
}

export class SessionManager implements ISessionManager {
  sessions: ISession[]

  constructor(sessions: ISession[] = []) {
    this.sessions = sessions
  }

  addSession(session: ISession): void {
    this.sessions.push(session)
  }

  listSessions(): ISession[] {
    return this.sessions
  }
}
