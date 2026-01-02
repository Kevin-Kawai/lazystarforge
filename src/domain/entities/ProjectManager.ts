import { type IProject } from "./Project.ts"

export interface IProjectManager {
  projects: IProject[],
  listProjects(): IProject[],
  addProject(project: IProject): void
}

export class ProjectManager implements IProjectManager {
  projects: IProject[]

  constructor(projects: IProject[] = []) {
    this.projects = projects
  }

  addProject(project: IProject): void {
    this.projects.push(project)
  }

  listProjects(): IProject[] {
    return this.projects
  }
}
