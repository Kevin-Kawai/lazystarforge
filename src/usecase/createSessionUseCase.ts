import { ClaudeCodeGateway } from "../gateway/ClaudeCodeGateway.ts";
import { ProjectRepository } from "../repository/projectRepository.ts";
import { SessionRepository } from "../repository/sessionRepository.ts";

export class CreateSessionUseCase {
  static async createSession(projectName: string, sessionName: string, userMessage: string) {
    const project = await ProjectRepository.find(projectName)

    let initialMessage = true
    let claudeCodeSessionId = null
    for await (const event of ClaudeCodeGateway.streamMessage(project.path, userMessage)) {
      if (event.type === "assistant_text") {
        if (initialMessage) {
          claudeCodeSessionId = event.sessionId
          project.startSession(claudeCodeSessionId, sessionName, userMessage)
          initialMessage = false
        }

        project.sendAssistantMessage(event.text, event.sessionId)
      }
    }

    const session = project.sessions.find(s => s.claudeCodeSessionId === claudeCodeSessionId)
    if (session === undefined) throw new Error("invalid session")
    await SessionRepository.save(session)
    await ProjectRepository.save(project)
  }
}
