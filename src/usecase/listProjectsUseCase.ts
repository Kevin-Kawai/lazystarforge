import { ProjectRepository } from "../repository/projectRepository.ts";

export class ListProjectsUseCase {
  static async listProjects() {
    const projects = await ProjectRepository.findAll()
    return projects
  }
}
