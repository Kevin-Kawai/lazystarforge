import type { Widgets } from "neo-blessed"
import type { Session } from "../../domain/entities/Session.ts"
import type { JobStatusMap } from "../types/AppState.ts"
import { ListSessionsUseCase } from "../../usecase/listSessionsUseCase.ts"
import { formatSessionsWithStatus } from "../utils/sessionFormatters.ts"

export function setSessionListFromSessions(
  sessionsList: Widgets.ListElement,
  sessions: Session[],
  statusMap: JobStatusMap,
  selectedSessionId: string | null
): string | null {
  if (sessions.length === 0) {
    sessionsList.setItems(["(sessions)"])
    sessionsList.select(0)
    sessionsList.style.fg = "gray" as any
    return null
  }

  const selectedSessionIdx = selectedSessionId ? sessions.map(s => s.claudeCodeSessionId).indexOf(selectedSessionId) : 0
  sessionsList.setItems(formatSessionsWithStatus(sessions, statusMap))
  sessionsList.select(selectedSessionIdx)
  sessionsList.style.fg = undefined as any
  return sessions[0].claudeCodeSessionId
}

export async function refreshSessionsForSelectedProject(
  sessionsList: Widgets.ListElement,
  screen: Widgets.Screen,
  projectName: string | null,
  selectedSessionId: string | null,
  statusMap: JobStatusMap
): Promise<Session[]> {
  if (projectName === null) {
    setSessionListFromSessions(sessionsList, [], statusMap, null)
    return []
  }

  const allSessions = await ListSessionsUseCase.ListSessions(projectName)
  const filtered = allSessions.filter((s) => s.project.name === projectName)

  setSessionListFromSessions(sessionsList, filtered, statusMap, selectedSessionId)
  screen.render()

  return filtered
}
