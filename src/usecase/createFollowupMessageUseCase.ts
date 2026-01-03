import { ClaudeCodeGateway } from "../gateway/ClaudeCodeGateway.ts";
import { ProjectRepository } from "../repository/projectRepository.ts";

export class createFollowupMessageUseCase {
  static async sendMessage(userMessage: string, projectName: string, sessionId: string) {
    const project = await ProjectRepository.find(projectName)
    project.sendUserMessage(userMessage, sessionId)

    for await (const event of ClaudeCodeGateway.streamMessage(project.path, userMessage, sessionId)) {
      if (event.type === "assistant_text") {
        project.sendAssistantMessage(event.text, event.sessionId)
      }
    }

    await ProjectRepository.save(project)
  }
}
