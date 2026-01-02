import { EMessenger, type IMessage, Message } from "./Message.ts";
import { type IProject, Project } from "./Project.ts";
import { type IProjectManager, ProjectManager } from "./ProjectManager.ts";
import { ESessionStatus, Session, type ISession } from "./Session.ts";
import { type ISessionManager, SessionManager } from "./SessionManager.ts";

export interface IOrchestrator {
  projectManager: IProjectManager,
  sessionManager: ISessionManager,
  newProject(...args: ConstructorParameters<typeof Project>): void,
  listProjects(): IProject[],
  newSession(...args: NewSessionArgs): void,
  listSessions(): ISession[],
  sendMessage(messenger: EMessenger, session: ISession, message: string): void,
  listMessages(session: ISession): IMessage[],
  takeoverSession(session: ISession): void
}

type SessionCtorArgs = ConstructorParameters<typeof Session>
type NewSessionArgs = [worktree: SessionCtorArgs[1], project: SessionCtorArgs[2], claudeCodeSessionId: SessionCtorArgs[3]]

export class Orchestrator implements IOrchestrator {
  projectManager: IProjectManager
  sessionManager: ISessionManager

  constructor(projectManager: IProjectManager = new ProjectManager, sessionManager: ISessionManager = new SessionManager) {
    this.projectManager = projectManager
    this.sessionManager = sessionManager
  }

  newProject(...args: ConstructorParameters<typeof Project>): void {
    // TODO: if name already exists throw error
    const project = new Project(...args)
    this.projectManager.addProject(project)
  }

  listProjects(): IProject[] {
    return this.projectManager.listProjects()
  }

  newSession(...args: NewSessionArgs): void {
    const session = new Session(ESessionStatus.IDLE, ...args)
    this.sessionManager.addSession(session)
  }

  listSessions(): ISession[] {
    return this.sessionManager.listSessions()
  }

  sendMessage(messenger: EMessenger = EMessenger.USER, session: ISession, messageContent: string): void {
    const message = new Message({ messenger: messenger, content: messageContent })
    session.sendMessage(message)
  }

  listMessages(session: ISession): IMessage[] {
    return session.messages
  }

  takeoverSession(session: ISession): void {
    session.manualTakeover()
  }
}
