import blessed from "neo-blessed"

export function createErrorModal(
  screen: blessed.Widgets.Screen,
  message: string,
  onClose: () => void
): void {
  const errorModal = blessed.box({
    parent: screen,
    top: "center",
    left: "center",
    width: 50,
    height: 5,
    border: "line",
    label: " Error ",
    tags: true,
    content: `\n{center}${message}{/center}`,
    style: { border: { fg: "red" } }
  })

  const close = () => {
    errorModal.detach()
    onClose()
    screen.render()
  }

  errorModal.key(["enter", "escape"], close)

  errorModal.focus()
  screen.render()
}
