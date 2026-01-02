import { query } from "@anthropic-ai/claude-agent-sdk"

export type ClaudeEvent =
  | { type: "assistant_text", text: string, sessionId: string }
  | { type: "tool_call", name: string }
  | { type: "done", subtype?: string }
  | { type: "raw", message: unknown }

export class ClaudeCodeGateway {
  static async *streamMessage(path: string, content: string, sessionId?: string): AsyncGenerator<ClaudeEvent> {
    console.log("session id")
    console.log(sessionId)
    for await (const message of query({
      prompt: content,
      options: {
        cwd: path,
        resume: sessionId
      }
    })) {
      if (message.type === "assistant" && message.message?.content) {
        for (const block of message.message.content) {
          if ("text" in block) yield { type: "assistant_text", text: block.text, sessionId: message.session_id }
          else if ("name" in block) yield { type: "tool_call", name: block.name }
        }
      } else if (message.type === "result") {
        yield { type: "done", subtype: message.subtype }
      }
    }
  }
}

