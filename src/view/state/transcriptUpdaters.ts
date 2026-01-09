import type { Widgets } from "neo-blessed"
import { ListMessagesUseCase } from "../../usecase/listMessagesUseCase.ts"
import { formatMessageThread } from "../utils/messageFormatters.ts"

export async function refreshMessagesForSelectedSession(
  transcript: Widgets.BoxElement,
  screen: Widgets.Screen,
  projectName: string | null,
  sessionId: string | null
): Promise<void> {
  if (sessionId === null || projectName === null) {
    setTranscriptContentAndScrollBottom(transcript, screen, "")
    return
  }

  const messages = await ListMessagesUseCase.listMessages(projectName, sessionId)
  const messageThread = formatMessageThread(messages)

  setTranscriptContentAndScrollBottom(transcript, screen, messageThread)
}

function setTranscriptContentAndScrollBottom(
  transcript: Widgets.BoxElement,
  screen: Widgets.Screen,
  content: string
): void {
  transcript.setContent(content)
  transcript.setScroll(0)
  screen.render()
  transcript.scrollTo(transcript.getScrollHeight())
  screen.render()
}
