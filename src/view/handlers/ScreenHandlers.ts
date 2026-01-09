import type { Widgets } from "neo-blessed"
import type { JobStatus } from "../../backgroundWorker/sessionJobManager.ts"
import { openQuitConfirmModal } from "../modals/QuitConfirmModal.ts"

export interface ScreenHandlerCallbacks {
  getStatusBySession: () => Map<string, JobStatus>
}

export function attachScreenHandlers(
  screen: Widgets.Screen,
  callbacks: ScreenHandlerCallbacks
): void {
  const { getStatusBySession } = callbacks

  const checkAndQuit = () => {
    const statusMap = getStatusBySession()
    const activeCount = Array.from(statusMap.values()).filter(
      status => status === "running" || status === "creating"
    ).length

    if (activeCount > 0) {
      openQuitConfirmModal(
        screen,
        activeCount,
        () => process.exit(0),
        () => {
          // Cancelled, just return to normal
        }
      )
    } else {
      process.exit(0)
    }
  }

  screen.key(["q", "C-c"], checkAndQuit)
}
