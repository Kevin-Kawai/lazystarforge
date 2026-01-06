import type { Widgets } from "neo-blessed"
import { ListMessagesUseCase } from "../../usecase/listMessagesUseCase.ts"
import { formatMessageThread } from "../utils/messageFormatters.ts"

export function setTranscriptContent(
  transcript: Widgets.BoxElement,
  content: string
): void {
  transcript.setContent(content)
  transcript.setScrollPerc(100)
}

export async function refreshMessagesForSelectedSession(
  transcript: Widgets.BoxElement,
  screen: Widgets.Screen,
  projectName: string | null,
  sessionId: string | null
): Promise<void> {
  if (sessionId === null || projectName === null) {
    transcript.setContent("")
    transcript.setScrollPerc(100)
    return
  }

  const messages = await ListMessagesUseCase.listMessages(projectName, sessionId)
  const messageThread = formatMessageThread(messages)

  setTranscriptContent(transcript, messageThread)
  screen.render()
}
