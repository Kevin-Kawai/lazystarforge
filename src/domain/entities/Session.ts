import { type IProject } from "./Project.ts"
import { EMessenger, Message, type IMessage } from "./Message.ts";

export enum ESessionStatus {
  ACTIVE = "active",
  IDLE = "idle"
}

export interface ISession {
  status: ESessionStatus,
  project: IProject,
  messages: IMessage[],
  claudeCodeSessionId: string,
  name: string,
  sendUserMessage(content: string): void,
  sendAssistantMessage(message: string): void,
  renameSession(newName: string): void
}

export class Session implements ISession {
  status: ESessionStatus
  project: IProject
  messages: IMessage[]
  claudeCodeSessionId: string;
  name: string;

  constructor(project: IProject, claudeCodeSessionId: string, name: string, status: ESessionStatus = ESessionStatus.IDLE, messages: IMessage[] = []) {
    this.status = status
    this.project = project
    this.claudeCodeSessionId = claudeCodeSessionId
    this.messages = messages
    this.name = name
  }

  sendUserMessage(content: string): void {
    const messenger = EMessenger.USER
    const message = new Message({ messenger, content })
    this.messages.push(message)
  }

  sendAssistantMessage(content: string): void {
    const messenger = EMessenger.SYSTEM
    const message = new Message({ messenger, content })
    this.messages.push(message)
  }

  renameSession(newName: string): void {
    this.name = newName
  }
}

