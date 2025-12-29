import { IProject } from "./Project"

export interface ISession {
  active: boolean,
  worktree: string,
  project: IProject,
  attach(): void,
  detach(): void,
}

export class Session implements ISession {
  active: true
  worktree: string
  project: IProject

  constructor(worktree: string, project: IProject) {
    this.worktree = worktree
    this.project = project
  }

  attach(): void {
    // TODO
  }

  detach(): void {
    // TODO
  }
}

