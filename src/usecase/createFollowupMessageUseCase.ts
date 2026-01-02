import { EMessenger } from "../domain/entities/Message.ts";
import { ClaudeCodeGateway } from "../gateway/ClaudeCodeGateway.ts";
import { OrchestratorRepository } from "../repository/orchestratorRepository.ts";

export class createFollowupMessageUseCase {
  static async sendMessage(userMessage: string, sessionId: string) {
    const orchestrator = await OrchestratorRepository.find()
    const session = orchestrator.listSessions().find((session) => {
      return session.claudeCodeSessionId === sessionId
    })

    if (session === undefined) throw new Error("invalid session")

    orchestrator.sendMessage(EMessenger.USER, session, userMessage)
    for await (const event of ClaudeCodeGateway.streamMessage(session.project.path, userMessage, sessionId)) {
      if (event.type === "assistant_text") {
        orchestrator.sendMessage(EMessenger.SYSTEM, session, event.text)
      }
    }
    await OrchestratorRepository.save(orchestrator)
  }
}
