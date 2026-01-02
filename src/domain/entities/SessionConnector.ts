import { EMessenger, type IMessage, Message } from "./Message.ts";
import { type IProject, Project } from "./Project.ts";
import { type IProjectManager, ProjectManager } from "./ProjectManager.ts";
import { Session, type ISession } from "./Session.ts";
import { type ISessionManager, SessionManager } from "./SessionManager.ts";

export interface ISessionConnector {
  projectManager: IProjectManager,
  sessionManager: ISessionManager,
  currentAttachedSession: ISession | null,
  newProject(...args: ConstructorParameters<typeof Project>): void,
  listProjects(): IProject[],
  newSession(...args: ConstructorParameters<typeof Session>): void,
  listSessions(): ISession[],
  sendMessage(session: ISession, message: String): void,
  listMessages(session: ISession): IMessage[],
  takeoverSession(session: ISession): void
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

  sendMessage(session: ISession, messageContent: String): void {
    const message = new Message({ messenger: EMessenger.USER, content: messageContent })
    session.sendMessage(message)
  }

  listMessages(session: ISession): IMessage[] {
    return session.messages
  }

  takeoverSession(session: ISession): void {
    session.manualTakeover()
  }
}
