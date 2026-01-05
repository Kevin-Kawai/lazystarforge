import type { Message } from "../../domain/entities/Message.ts"

export function formatMessageThread(messages: Message[]): string {
  return messages.reduce((acc, message) => {
    return acc.concat(message.messenger + "\n" + message.content + "\n\n")
  }, "")
}
