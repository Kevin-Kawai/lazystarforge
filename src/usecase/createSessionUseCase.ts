import { EMessenger } from "../domain/entities/Message.ts";
import { ClaudeCodeGateway } from "../gateway/ClaudeCodeGateway.ts";
import { OrchestratorRepository } from "../repository/orchestratorRepository.ts";

export class CreateSessionUseCase {
  static async createSession(worktree: string, projectName: string, userMessage: string) {
    const orchestrator = await OrchestratorRepository.find()
    const project = orchestrator.listProjects().find((project) => {
      return project.name === projectName
    })

    if (project === undefined) {
      throw new Error("project does not exist")
    }

    let initialMessage = true
    for await (const event of ClaudeCodeGateway.streamMessage(project.path, userMessage)) {
      if (event.type === "assistant_text") {
        if (initialMessage) {
          orchestrator.newSession(worktree, project, event.sessionId)
        }

        const session = orchestrator.listSessions().find((session) => {
          return session.claudeCodeSessionId === event.sessionId
        })

        if (session === undefined) throw new Error("invalid session")
        if (initialMessage) {
          orchestrator.sendMessage(EMessenger.USER, session, userMessage)
          initialMessage = false
        }
        orchestrator.sendMessage(EMessenger.SYSTEM, session, event.text)
      }
    }

    await OrchestratorRepository.save(orchestrator)
  }
}
