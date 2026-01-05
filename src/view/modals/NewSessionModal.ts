import blessed from "neo-blessed"

export function openNewSessionModal(
  screen: blessed.Widgets.Screen,
  projectName: string | null,
  onSubmit: (message: string) => void,
  onCancel: () => void
): void {
  const modal = blessed.box({
    parent: screen,
    top: "center",
    left: "center",
    width: "60%",
    height: 7,
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
    content: "Enter initial message (Esc to cancel)"
  })

  const prompt = blessed.textbox({
    parent: modal,
    top: 3,
    left: 1,
    width: "100%-3",
    height: 3,
    border: "line",
    inputOnFocus: true,
    keys: true,
    mouse: true
  })

  const close = () => {
    prompt.cancel()
    modal.detach()
    onCancel()
    screen.render()
  }

  prompt.key("escape", close)

  prompt.on("submit", async (value: string) => {
    const text = (value ?? "").trim()
    if (!text) return close()

    onSubmit(text)
    close()
  })

  prompt.focus()
  prompt.readInput()
  screen.render()
}
