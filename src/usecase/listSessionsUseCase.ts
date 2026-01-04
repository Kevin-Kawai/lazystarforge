import { ProjectRepository } from "../repository/projectRepository.ts";

export class ListSessionsUseCase {
  static async ListSessions(projectName: string) {
    try {
      const project = await ProjectRepository.find(projectName)
      return project.sessions
    } catch (error: any) {
      // If project doesn't exist, return empty sessions array
      if (error.message?.includes('Project not found')) {
        return []
      }
      throw error
    }
  }
}
