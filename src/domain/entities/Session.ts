import { type IProject } from "./Project.ts"
import { type IMessage } from "./Message.ts";

export enum ESessionStatus {
  ACTIVE = "active",
  IDLE = "idle"
}

export interface ISession {
  status: ESessionStatus,
  worktree: string,
  project: IProject,
  messages: IMessage[],
  sendMessage(message: IMessage): void,
  manualTakeover(): void
}

export class Session implements ISession {
  status: ESessionStatus
  worktree: string
  project: IProject
  messages: IMessage[]

  constructor(status: ESessionStatus = ESessionStatus.IDLE, worktree: string, project: IProject, messages: IMessage[] = []) {
    this.status = status
    this.worktree = worktree
    this.project = project
    this.messages = messages
  }

  sendMessage(message: IMessage): void {
    this.messages.push(message)
  }

  manualTakeover(): void {
    // TODO
  }
}

