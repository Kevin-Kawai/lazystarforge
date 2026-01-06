import type { Widgets } from "neo-blessed"

export interface TranscriptCallbacks {
  input: Widgets.TextboxElement
  sessionsList: Widgets.ListElement
}

export function attachTranscriptHandlers(
  transcript: Widgets.BoxElement,
  callbacks: TranscriptCallbacks
): void {
  const { input, sessionsList } = callbacks

  transcript.key("j", () => {
    transcript.scroll(1)
    transcript.screen.render()
  })

  transcript.key("k", () => {
    transcript.scroll(-1)
    transcript.screen.render()
  })

  transcript.key("tab", () => {
    input.focus()
    input.readInput()
    transcript.screen.render()
  })

  transcript.key("S-tab", () => {
    sessionsList.focus()
    transcript.screen.render()
  })
}
