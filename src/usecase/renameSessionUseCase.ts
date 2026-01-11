import { SessionRepository } from "../repository/sessionRepository.ts";

export class RenameSessionUseCase {
  static async renameSession(newName: string, sessionId: string) {
    const session = await SessionRepository.find(sessionId)
    session.renameSession(newName)
    await SessionRepository.save(session)
  }
}
