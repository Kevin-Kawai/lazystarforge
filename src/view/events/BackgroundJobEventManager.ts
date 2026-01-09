import type { JobEvent, JobStatus } from "../../backgroundWorker/sessionJobManager.ts"
import type { JobStatusMap } from "../types/AppState.ts"

export interface BackgroundJobCallbacks {
  refreshSessions: () => Promise<void>
  refreshMessages: () => Promise<void>
  getSelectedProjectName: () => string | null
  getSelectedSessionId: () => string | null
  statusBySession: JobStatusMap
  placeholderSessions: Map<string, string[]>
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
    statusBySession,
    placeholderSessions
  } = callbacks

  backgroundJobs.on("event", (e: JobEvent) => {
    if (e.type === "session_creating") {
      // Add placeholder session to the project's list
      const existing = placeholderSessions.get(e.projectName) || []
      placeholderSessions.set(e.projectName, [...existing, e.tempSessionId])
      void refreshSessions()
      return
    }

    if (e.type === "session_created") {
      // Remove placeholder and let the real session show up
      const existing = placeholderSessions.get(e.projectName) || []
      placeholderSessions.set(
        e.projectName,
        existing.filter(id => id !== e.tempSessionId)
      )
      // Remove the placeholder's status entry to avoid double-counting
      statusBySession.delete(e.tempSessionId)
      // Status will be handled by the session_status event
      return
    }

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
