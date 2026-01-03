import { ProjectRepository } from "../repository/projectRepository.ts";

export class ListMessagesUseCase {
  static async listMessages(projectName: string, sessionId: string) {
    const project = await ProjectRepository.find(projectName)
    return project.viewMessages(sessionId)
  }
}
