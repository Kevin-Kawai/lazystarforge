import { ProjectRepository } from "../repository/projectRepository.ts";

export class ListSessionsUseCase {
  static async ListSessions(projectName: string) {
    const project = await ProjectRepository.find(projectName)
    return project.sessions
  }
}
