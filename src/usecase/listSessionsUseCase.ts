import { OrchestratorRepository } from "../repository/orchestratorRepository.ts";

export class ListSessionsUseCase {
  static async ListSessions() {
    const orchestrator = await OrchestratorRepository.find()
    const sessions = orchestrator.listSessions()
    return sessions
  }
}
