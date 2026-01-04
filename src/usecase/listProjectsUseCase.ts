import { ProjectRepository } from "../repository/projectRepository.ts";
import { ensureDataDirectories } from "../utils/ensureDataDirectories.ts"

export class ListProjectsUseCase {
  static async listProjects() {
    // Ensure data directories exist before attempting to read
    await ensureDataDirectories()

    const projects = await ProjectRepository.findAll()
    return projects
  }
}
