import type { Widgets } from "neo-blessed"

export interface SessionsListCallbacks {
  onSessionSelected: (sessionId: string | null) => Promise<void>
  onNewSessionRequest: () => void
  onDeleteSessionRequest: () => void
  projectsList: Widgets.ListElement
  transcript: Widgets.BoxElement
}

export function attachSessionsListHandlers(
  sessionsList: Widgets.ListElement,
  callbacks: SessionsListCallbacks
): void {
  const {
    onSessionSelected,
    onNewSessionRequest,
    onDeleteSessionRequest,
    projectsList,
    transcript
  } = callbacks

  sessionsList.key(["tab"], () => {
    if (sessionsList.screen.focused === projectsList) {
      sessionsList.focus()
    } else {
      projectsList.focus()
    }
  })

  sessionsList.on("select item", async (item, index) => {
    const itemText = item.getText()

    if (itemText.includes("no sessions")) {
      await onSessionSelected(null)
      return
    }

    await onSessionSelected(itemText)
    sessionsList.screen.render()
  })

  sessionsList.key("n", () => {
    onNewSessionRequest()
  })

  sessionsList.key("d", () => {
    onDeleteSessionRequest()
  })

  sessionsList.key("enter", () => {
    transcript.focus()
    sessionsList.screen.render()
  })
}
