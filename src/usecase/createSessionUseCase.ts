import { OrchestratorRepository } from "../repository/orchestratorRepository.ts";

export class CreateSessionUseCase {
  static async createSession(worktree: string, projectName: string) {
    const orchestrator = await OrchestratorRepository.find()
    const project = orchestrator.listProjects().find((project) => {
      return project.name === projectName
    })

    if (project === undefined) {
      throw new Error("project does not exist")
    }

    orchestrator.newSession(worktree, project)
    await OrchestratorRepository.save(orchestrator)
  }
}
