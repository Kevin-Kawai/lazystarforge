import blessed from "neo-blessed"

export function openDeleteSessionModal(
  screen: blessed.Widgets.Screen,
  sessionId: string,
  onConfirm: () => Promise<void>,
  onCancel: () => void
): void {
  const confirmModal = blessed.box({
    parent: screen,
    top: "center",
    left: "center",
    width: "50%",
    height: 7,
    border: "line",
    label: " Confirm Delete ",
    tags: true,
    style: { border: { fg: "red" } }
  })

  blessed.box({
    parent: confirmModal,
    top: 1,
    left: 1,
    height: 1,
    content: `Delete session ${sessionId}?`
  })

  blessed.box({
    parent: confirmModal,
    top: 3,
    left: 1,
    height: 1,
    content: "Press 'y' to confirm, any other key to cancel"
  })

  const close = () => {
    confirmModal.detach()
    onCancel()
    screen.render()
  }

  screen.onceKey("y", async () => {
    try {
      await onConfirm()
    } finally {
      close()
    }
  })

  screen.key(["escape", "n", "q"], close)

  screen.render()
}
