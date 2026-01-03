import { OrchestratorRepository } from "../repository/orchestratorRepository.ts";

export class ListMessagesUseCase {
  static async listMesseges(sessionId: string) {
    const orchestrator = await OrchestratorRepository.find()
    const session = orchestrator.listSessions().find((session) => {
      return session.claudeCodeSessionId === sessionId
    })

    if (session === undefined) throw new Error("invalid session")

    return orchestrator.listMessages(session)
  }
}
