import { Project } from "../domain/entities/Project.ts"
import { ProjectRepository } from "../repository/projectRepository.ts"
import { normalizeCwd } from "../utils/normalizeCwd.ts"

export class CreateProjectUseCase {
  static async createProject(name: string, path: string) {
    const normalizedPath = normalizeCwd(path)
    const project = new Project(normalizedPath, name)
    await ProjectRepository.save(project)
  }
}
