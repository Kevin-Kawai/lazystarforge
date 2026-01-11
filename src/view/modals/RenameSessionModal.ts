import blessed from "neo-blessed"

export function openRenameSessionModal(
  screen: blessed.Widgets.Screen,
  sessionId: string,
  onSubmit: (name: string, sessionId: string) => void,
  onCancel: () => void
): void {
  const modal = blessed.box({
    parent: screen,
    top: "center",
    left: "center",
    width: "70%",
    height: 11,
    border: "line",
    label: " New session ",
    tags: true,
    style: { border: { fg: "cyan" } }
  })

  blessed.box({
    parent: modal,
    top: 1,
    left: 1,
    height: 1,
    content: "New session Name: (Esc to cancel)"
  })

  const sessionNameInput = blessed.textbox({
    parent: modal,
    top: 2,
    left: 1,
    width: "100%-3",
    height: 3,
    border: "line",
    inputOnFocus: true,
    keys: true,
    mouse: true
  })

  const close = () => {
    sessionNameInput.cancel()
    modal.detach()
    onCancel()
    screen.render()
  }

  sessionNameInput.on("submit", async (value: string) => {
    const name = (value ?? "").trim()
    if (!name) return close()

    onSubmit(name, sessionId)
    close()
  })

  sessionNameInput.key("escape", close)

  sessionNameInput.focus()
  sessionNameInput.readInput()
  screen.render()
}
