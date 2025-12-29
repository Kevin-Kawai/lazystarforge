import { IProject } from "./Project"

export interface IProjectManager {
  projects: IProject[],
  listProjects(): IProject[],
  addProject(project: IProject): void
}

export class ProjectManager implements IProjectManager {
  projects: IProject[]

  constructor() {
    this.projects = []
  }

  addProject(project: IProject): void {
    this.projects.push(project)
  }

  listProjects(): IProject[] {
    return this.projects
  }
}
