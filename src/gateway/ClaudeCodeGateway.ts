import { query } from "@anthropic-ai/claude-agent-sdk"
import type { ISession } from "../domain/entities/Session.ts"

export type ClaudeEvent =
  | { type: "assistant_text", text: string }
  | { type: "tool_call", name: string }
  | { type: "done", subtype?: string }
  | { type: "raw", message: unknown }

export class ClaudeCodeGateway {
  static async *streamMessage(session: ISession, content: string): AsyncGenerator<ClaudeEvent> {
    for await (const message of query({
      prompt: content,
      options: {
        cwd: session.project.path
      }
    })) {
      if (message.type === "assistant" && message.message?.content) {
        for (const block of message.message.content) {
          if ("text" in block) yield { type: "assistant_text", text: block.text }
          else if ("name" in block) yield { type: "tool_call", name: block.name }
        }
      } else if (message.type === "result") {
        yield { type: "done", subtype: message.subtype }
      }
    }
  }
}

