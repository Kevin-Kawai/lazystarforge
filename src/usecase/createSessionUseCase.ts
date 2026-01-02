import { type IProject } from "../domain/entities/Project.js";
import { Session } from "../domain/entities/Session.js";

export class CreateSessionUseCase {
  static async createSession(worktree: string, project: IProject) {
    const session = new Session(worktree, project)
    return session
  }
}
