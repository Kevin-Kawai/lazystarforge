import { ProjectRepository } from "../repository/projectRepository.ts";
import { SessionRepository } from "../repository/sessionRepository.ts";

export class DeleteSessionUseCase {
  static async DeleteSession(projectName: string, sessionId: string) {
    const project = await ProjectRepository.find(projectName)

    project.deleteSession(sessionId)

    await ProjectRepository.save(project)

    await SessionRepository.delete(sessionId)
  }
}
