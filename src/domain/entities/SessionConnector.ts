import { IProject, Project } from "./Project";
import { IProjectManager, ProjectManager } from "./ProjectManager";
import { Session, ISession } from "./Session";
import { ISessionManager, SessionManager } from "./SessionManager";

export interface ISessionConnector {
  projectManager: IProjectManager,
  sessionManager: ISessionManager,
  currentAttachedSession: ISession | null,
  newProject(...args: ConstructorParameters<typeof Project>): void,
  listProjects(): IProject[],
  newSession(...args: ConstructorParameters<typeof Session>): void,
  listSessions(): ISession[],
  attachToSession(session: ISession): void,
  detachFromSession(): void
}

export class SessionConnector implements ISessionConnector {
  projectManager: IProjectManager
  sessionManager: ISessionManager
  currentAttachedSession: ISession | null = null

  constructor() {
    this.projectManager = new ProjectManager
    this.sessionManager = new SessionManager
  }

  newProject(...args: ConstructorParameters<typeof Project>): void {
    const project = new Project(...args)
    this.projectManager.addProject(project)
  }

  listProjects(): IProject[] {
    return this.projectManager.listProjects()
  }

  newSession(...args: ConstructorParameters<typeof Session>): void {
    const session = new Session(...args)
    this.sessionManager.addSession(session)
  }

  listSessions(): ISession[] {
    return this.sessionManager.listSessions()
  }

  attachToSession(session: ISession): void {
    session.attach()
    this.currentAttachedSession = session
  }

  detachFromSession(): void {
    const session = this.currentAttachedSession
    if (!session) return
    session.detach()
    this.currentAttachedSession = null
  }
}
