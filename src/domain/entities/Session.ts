import { type IProject } from "./Project.ts"
import { EMessenger, Message, type IMessage } from "./Message.ts";

export enum ESessionStatus {
  ACTIVE = "active",
  IDLE = "idle"
}

export interface ISession {
  status: ESessionStatus,
  updated: boolean,
  project: IProject,
  messages: IMessage[],
  claudeCodeSessionId: string,
  sendUserMessage(content: string): void,
  sendAssistantMessage(message: string): void,
}

export class Session implements ISession {
  status: ESessionStatus
  updated: boolean
  project: IProject
  messages: IMessage[]
  claudeCodeSessionId: string;

  constructor(status: ESessionStatus = ESessionStatus.IDLE, project: IProject, claudeCodeSessionId: string, messages: IMessage[] = []) {
    this.status = status
    this.project = project
    this.claudeCodeSessionId = claudeCodeSessionId
    this.messages = messages
    this.updated = false
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
}

