import { OrchestratorRepository } from "../repository/orchestratorRepository.ts";

export class ListProjectsUseCase {
  static async listProjects() {
    const orchestrator = await OrchestratorRepository.find()
    const projects = orchestrator.listProjects()
    return projects
  }
}
