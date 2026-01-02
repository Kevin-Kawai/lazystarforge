import { EMessenger, Message } from "../domain/entities/Message.ts";
import { ESessionStatus, type ISession } from "../domain/entities/Session.ts";
import { ClaudeCodeGateway } from "../gateway/ClaudeCodeGateway.ts";

export class SendMessageUseCase {
  static async sendMessage(message: string, session: ISession) {
    const userMessage = new Message({ messenger: EMessenger.USER, content: message })
    session.sendMessage(userMessage)

    session.status = ESessionStatus.ACTIVE
    for await (const event of ClaudeCodeGateway.streamMessage(session, message)) {
      if (event.type === "assistant_text") {
        const systemMessage = new Message({ messenger: EMessenger.SYSTEM, content: event.text })
        session.sendMessage(systemMessage)
      }
      if (event.type === "done") session.status = ESessionStatus.IDLE
    }
  }
}
