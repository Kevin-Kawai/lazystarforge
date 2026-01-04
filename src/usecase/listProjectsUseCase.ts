import { ProjectRepository } from "../repository/projectRepository.ts";
import { ensureDataDirectories } from "../utils/ensureDataDirectories.ts"

export class ListProjectsUseCase {
  static async listProjects() {
    await ensureDataDirectories()

    const projects = await ProjectRepository.findAll()
    return projects
  }
}
