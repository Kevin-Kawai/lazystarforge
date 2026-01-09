import blessed from "neo-blessed"

export function openQuitConfirmModal(
  screen: blessed.Widgets.Screen,
  activeSessionCount: number,
  onConfirm: () => void,
  onCancel: () => void
): void {
  const confirmModal = blessed.box({
    parent: screen,
    top: "center",
    left: "center",
    width: "50%",
    height: 9,
    border: "line",
    label: " Confirm Quit ",
    tags: true,
    style: { border: { fg: "yellow" } }
  })

  blessed.box({
    parent: confirmModal,
    top: 1,
    left: 1,
    height: 1,
    content: `Warning: ${activeSessionCount} session${activeSessionCount > 1 ? "s are" : " is"} currently active!`
  })

  blessed.box({
    parent: confirmModal,
    top: 3,
    left: 1,
    height: 1,
    content: "Quitting will stop all running sessions."
  })

  blessed.box({
    parent: confirmModal,
    top: 5,
    left: 1,
    height: 1,
    content: "Press 'y' to quit anyway, 'n' or 'escape' to cancel"
  })

  let modalClosed = false

  const close = () => {
    if (modalClosed) return
    modalClosed = true

    confirmModal.detach()
    // Remove all key handlers
    screen.unkey("y", confirmHandler)
    screen.unkey("escape", cancelHandler)
    screen.unkey("n", cancelHandler)
    onCancel()
    screen.render()
  }

  const confirmHandler = () => {
    if (modalClosed) return
    modalClosed = true

    confirmModal.detach()
    // Remove all key handlers
    screen.unkey("y", confirmHandler)
    screen.unkey("escape", cancelHandler)
    screen.unkey("n", cancelHandler)
    onConfirm()
  }

  const cancelHandler = () => close()

  screen.key("y", confirmHandler)
  screen.key("escape", cancelHandler)
  screen.key("n", cancelHandler)

  screen.render()
}
