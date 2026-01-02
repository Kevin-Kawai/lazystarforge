import { IProject } from "./Project"
import { IMessage } from "./Message";

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

  constructor(worktree: string, project: IProject) {
    this.status = ESessionStatus.IDLE
    this.worktree = worktree
    this.project = project
    this.messages = []
  }

  sendMessage(message: IMessage): void {
    this.messages.push(message)
  }

  manualTakeover(): void {
    // TODO
  }
}

