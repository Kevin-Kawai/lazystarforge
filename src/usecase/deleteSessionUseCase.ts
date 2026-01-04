import { ProjectRepository } from "../repository/projectRepository.ts";
import { SessionRepository } from "../repository/sessionRepository.ts";

export class DeleteSessionUseCase {
  static async DeleteSession(projectName: string, sessionId: string) {
    // Load the project
    const project = await ProjectRepository.find(projectName)

    // Remove session from project's sessions array
    project.deleteSession(sessionId)

    // Save updated project (without the deleted session reference)
    await ProjectRepository.save(project)

    // Delete the session file from disk
    await SessionRepository.delete(sessionId)
  }
}
