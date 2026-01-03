import { ClaudeCodeGateway } from "../gateway/ClaudeCodeGateway.ts";
import { ProjectRepository } from "../repository/projectRepository.ts";

export class CreateSessionUseCase {
  static async createSession(projectName: string, userMessage: string) {
    const project = await ProjectRepository.find(projectName)

    let initialMessage = true
    for await (const event of ClaudeCodeGateway.streamMessage(project.path, userMessage)) {
      if (event.type === "assistant_text") {
        if (initialMessage) {
          project.startSession(event.sessionId, userMessage)
          initialMessage = false
        }

        project.sendAssistantMessage(event.text, event.sessionId)
      }
    }

    await ProjectRepository.save(project)
  }
}
