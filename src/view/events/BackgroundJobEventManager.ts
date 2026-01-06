import type { JobEvent, JobStatus } from "../../backgroundWorker/sessionJobManager.ts"
import type { JobStatusMap } from "../types/AppState.ts"

export interface BackgroundJobCallbacks {
  refreshSessions: () => Promise<void>
  refreshMessages: () => Promise<void>
  getSelectedProjectName: () => string | null
  getSelectedSessionId: () => string | null
  statusBySession: JobStatusMap
}

export function attachBackgroundJobEventHandlers(
  backgroundJobs: any,
  callbacks: BackgroundJobCallbacks
): void {
  const {
    refreshSessions,
    refreshMessages,
    getSelectedProjectName,
    getSelectedSessionId,
    statusBySession
  } = callbacks

  backgroundJobs.on("event", (e: JobEvent) => {
    if (e.type === "session_status") {
      statusBySession.set(e.sessionId, e.status)

      void refreshSessions()

      if (
        e.projectName === getSelectedProjectName() &&
        e.sessionId === getSelectedSessionId()
      ) {
        void refreshMessages()
      }
      return
    }

    if (e.type === "session_changed") {
      if (e.projectName === getSelectedProjectName()) {
        void refreshSessions()
      }
    }

    if (e.type === "session_updated") {
      if (
        e.projectName === getSelectedProjectName() &&
        e.sessionId === getSelectedSessionId()
      ) {
        void refreshMessages()
      }
    }
  })
}
