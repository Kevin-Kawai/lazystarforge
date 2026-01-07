import { ProjectRepository } from "../repository/projectRepository.ts"
import { SessionRepository } from "../repository/sessionRepository.ts"

export class DeleteProjectUseCase {
  static async DeleteProject(projectName: string) {
    try {
      // 1. Load the project to get all session IDs
      const project = await ProjectRepository.find(projectName)

      // 2. Delete all associated sessions (allow individual failures)
      const deletionResults = await Promise.allSettled(
        project.sessions.map((session) =>
          SessionRepository.delete(session.claudeCodeSessionId)
        )
      )

      // Log any session deletion failures
      deletionResults.forEach((result, index) => {
        if (result.status === "rejected") {
          const sessionId = project.sessions[index].claudeCodeSessionId
          console.error(`Failed to delete session ${sessionId}:`, result.reason)
        }
      })

      // 3. Delete the project file regardless of session deletion results
      await ProjectRepository.delete(projectName)
    } catch (error) {
      console.error(`Failed to delete project ${projectName}:`, error)
      throw error
    }
  }
}
