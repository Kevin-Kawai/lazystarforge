import type { Widgets } from "neo-blessed"
import type { Session } from "../../domain/entities/Session.ts"
import type { JobStatusMap } from "../types/AppState.ts"
import { ListSessionsUseCase } from "../../usecase/listSessionsUseCase.ts"
import { formatSessionsWithStatus } from "../utils/sessionFormatters.ts"

export function setSessionListFromSessions(
  sessionsList: Widgets.ListElement,
  sessions: Session[],
  statusMap: JobStatusMap,
  selectedSessionId: string | null,
  placeholderSessionIds: string[] = []
): string | null {
  // Combine real sessions with placeholder sessions
  const allSessionIds = [
    ...placeholderSessionIds,
    ...sessions.map(s => s.claudeCodeSessionId)
  ]

  if (allSessionIds.length === 0) {
    sessionsList.setItems(["(sessions)"])
    sessionsList.select(0)
    sessionsList.style.fg = "gray" as any
    return null
  }

  // Format all sessions (placeholders will be handled by formatSessionsWithStatus)
  const formattedItems = allSessionIds.map(id => {
    const status = statusMap.get(id)
    const suffix =
      status === "creating" ? " [creating...]" :
        status === "running" ? " [running]" :
          status === "error" ? " [error]" : " [idle]"
    return `${id}${suffix}`
  })

  const selectedSessionIdx = selectedSessionId ? allSessionIds.indexOf(selectedSessionId) : 0
  // If the previously selected session doesn't exist in this list, default to the first session
  const validIdx = selectedSessionIdx >= 0 ? selectedSessionIdx : 0
  sessionsList.setItems(formattedItems)
  sessionsList.select(validIdx)
  sessionsList.style.fg = undefined as any
  return allSessionIds[validIdx]
}

export async function refreshSessionsForSelectedProject(
  sessionsList: Widgets.ListElement,
  screen: Widgets.Screen,
  projectName: string | null,
  selectedSessionId: string | null,
  statusMap: JobStatusMap,
  placeholderSessionIds: string[] = []
): Promise<Session[]> {
  if (projectName === null) {
    setSessionListFromSessions(sessionsList, [], statusMap, null, [])
    return []
  }

  const allSessions = await ListSessionsUseCase.ListSessions(projectName)
  const filtered = allSessions.filter((s) => s.project.name === projectName)

  setSessionListFromSessions(sessionsList, filtered, statusMap, selectedSessionId, placeholderSessionIds)
  screen.render()

  return filtered
}
