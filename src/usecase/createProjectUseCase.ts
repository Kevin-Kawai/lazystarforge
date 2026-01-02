import { OrchestratorRepository } from "../repository/orchestratorRepository.ts"
import { normalizeCwd } from "../utils/normalizeCwd.ts"

export class CreateProjectUseCase {
  static async createProject(name: string, path: string) {
    const normalizedPath = normalizeCwd(path)
    const orchestrator = await OrchestratorRepository.find()
    orchestrator.newProject(normalizedPath, name)
    await OrchestratorRepository.save(orchestrator)
  }
}
