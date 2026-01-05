import blessed from "neo-blessed"
import type { Session } from "../../domain/entities/Session.ts"
import type { JobStatusMap } from "../types/AppState.ts"

/**
 * Temporary inline formatting function until Phase 2 is complete.
 * This will be replaced with an import from ../utils/sessionFormatters.ts
 */
function formatSessionsWithStatus(sessions: Session[], statusMap: JobStatusMap): string[] {
  return sessions.map((session) => {
    const status = statusMap.get(session.claudeCodeSessionId)
    const suffix =
      status === "running" ? " [runnning]" :
        status === "error" ? " [error]" : " [idle]"

    return `${session.claudeCodeSessionId}${suffix}`
  })
}

export function createSessionsList(
  screen: blessed.Widgets.Screen,
  sessions: Session[],
  statusMap: JobStatusMap
): blessed.Widgets.ListElement {
  return blessed.list({
    parent: screen,
    top: "30%",
    left: 0,
    width: "30%-1",
    height: "30%",
    border: "line",
    label: "Sessions ",
    keys: true,
    mouse: true,
    vi: true,
    tags: true,
    style: { selected: { inverse: true } },
    items: sessions.length > 0
      ? formatSessionsWithStatus(sessions, statusMap)
      : ["{gray-fg}(no sessions - press 'n' to create){/gray-fg}"]
  })
}
