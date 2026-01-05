import blessed from "neo-blessed"

export function openNewProjectModal(
  screen: blessed.Widgets.Screen,
  onSubmit: (name: string, path: string) => Promise<void>,
  onCancel: () => void
): void {
  const modal = blessed.box({
    parent: screen,
    top: "center",
    left: "center",
    width: "70%",
    height: 11,
    border: "line",
    label: " New project ",
    tags: true,
    style: { border: { fg: "cyan " } }
  })

  blessed.box({
    parent: modal,
    top: 1,
    left: 1,
    height: 1,
    content: "Project name:"
  })

  const nameInput = blessed.textbox({
    parent: modal,
    top: 2,
    left: 1,
    width: "100%-3",
    height: 3,
    border: "line",
    inputOnFocus: true,
    keys: true,
    mouse: true,
  })

  blessed.box({
    parent: modal,
    top: 5,
    left: 1,
    height: 1,
    content: "Project path:",
  })

  const pathInput = blessed.textbox({
    parent: modal,
    top: 6,
    left: 1,
    width: "100%-3",
    height: 3,
    border: "line",
    inputOnFocus: true,
    keys: true,
    mouse: true,
  })

  const close = () => {
    nameInput.cancel()
    pathInput.cancel()
    modal.detach()
    onCancel()
    screen.render()
  }

  nameInput.key("escape", close)
  pathInput.key("escape", close)

  nameInput.on("submit", (value: string) => {
    const name = (value ?? "").trim()
    if (!name) return
    pathInput.focus()
    pathInput.readInput()
    screen.render()
  })

  pathInput.key(["S-tab", "backtab"], () => {
    pathInput.cancel()
    nameInput.focus()
    nameInput.readInput()
    screen.render()
  })

  pathInput.on("submit", async (value: string) => {
    const name = (nameInput.getValue() ?? "").trim()
    const p = (value ?? "").trim()
    if (!name || !p) return close()

    try {
      await onSubmit(name, p)
    } finally {
      close()
    }
  })

  nameInput.focus()
  nameInput.readInput()
  screen.render()
}
