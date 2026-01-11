import blessed from "neo-blessed"

export function openNewSessionModal(
  screen: blessed.Widgets.Screen,
  projectName: string | null,
  onSubmit: (name: string, message: string) => void,
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
    content: "Session Name: (Esc to cancel)"
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

  blessed.box({
    parent: modal,
    top: 5,
    left: 1,
    height: 1,
    content: "Enter initial message (Esc to cancel)"
  })

  const prompt = blessed.textbox({
    parent: modal,
    top: 6,
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
    prompt.cancel()
    modal.detach()
    onCancel()
    screen.render()
  }

  sessionNameInput.on("submit", (value: string) => {
    const name = (value ?? "").trim()
    if (!name) return
    prompt.focus()
    screen.render()
  })

  sessionNameInput.key("escape", close)

  prompt.key("escape", close)

  prompt.on("submit", async (value: string) => {
    const name = (sessionNameInput.getValue() ?? "").trim()
    const text = (value ?? "").trim()
    if (!name || !text) return close()

    onSubmit(name, text)
    close()
  })

  sessionNameInput.focus()
  sessionNameInput.readInput()
  screen.render()
}
