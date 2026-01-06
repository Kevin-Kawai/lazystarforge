import type { Widgets } from "neo-blessed"

export interface InputCallbacks {
  onMessageSubmit: (message: string) => void
  onNoSessionError: () => void
  transcript: Widgets.BoxElement
  hasSelectedSession: () => boolean
}

export function attachInputHandlers(
  input: Widgets.TextboxElement,
  callbacks: InputCallbacks
): void {
  const { onMessageSubmit, onNoSessionError, transcript, hasSelectedSession } = callbacks

  input.on("submit", async (value: string) => {
    const text = (value ?? "").trim()
    input.clearValue()
    if (!text) return

    if (!hasSelectedSession()) {
      onNoSessionError()
      return
    }

    onMessageSubmit(text)
  })

  input.key(["S-tab", "backtab"], () => {
    input.cancel()
    transcript.focus()
    input.screen.render()
  })
}
