import blessed from "neo-blessed"

export function openDeleteProjectModal(
  screen: blessed.Widgets.Screen,
  projectName: string,
  onConfirm: () => Promise<void>,
  onCancel: () => void
): void {
  const confirmModal = blessed.box({
    parent: screen,
    top: "center",
    left: "center",
    width: "60%",
    height: 9,
    border: "line",
    label: " Confirm Delete Project ",
    tags: true,
    style: { border: { fg: "red" } }
  })

  blessed.box({
    parent: confirmModal,
    top: 1,
    left: 1,
    height: 1,
    content: `Delete project '${projectName}'?`
  })

  blessed.box({
    parent: confirmModal,
    top: 3,
    left: 1,
    height: 1,
    content: "WARNING: This will delete all associated sessions!",
    style: { fg: "yellow" }
  })

  blessed.box({
    parent: confirmModal,
    top: 5,
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
