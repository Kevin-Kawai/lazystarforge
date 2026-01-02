import { Project } from "../domain/entities/Project.ts"

export class CreateProjectUseCase {
  static async createProject(name: string, path: string) {
    const project = new Project(path, name)
    return project
  }
}
