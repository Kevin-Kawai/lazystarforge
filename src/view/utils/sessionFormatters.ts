import type { Session } from "../../domain/entities/Session.ts"
import type { JobStatus } from "../../backgroundWorker/sessionJobManager.ts"

export function formatSessionsWithStatus(
  sessions: Session[],
  statusMap: Map<string, JobStatus>
): string[] {
  return sessions.map((session) => {
    const status = statusMap.get(session.claudeCodeSessionId)
    const suffix =
      status === "creating" ? " [creating...]" :
        status === "running" ? " [running]" :
          status === "error" ? " [error]" : " [idle]"

    return `${session.name}${suffix}`
  })
}
