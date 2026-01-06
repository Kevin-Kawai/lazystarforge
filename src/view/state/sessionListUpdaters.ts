import type { Widgets } from "neo-blessed"
import type { Session } from "../../domain/entities/Session.ts"
import type { JobStatusMap } from "../types/AppState.ts"
import { ListSessionsUseCase } from "../../usecase/listSessionsUseCase.ts"
import { formatSessionsWithStatus } from "../utils/sessionFormatters.ts"

export function setSessionListFromSessions(
  sessionsList: Widgets.ListElement,
  sessions: Session[],
  statusMap: JobStatusMap
): string | null {
  if (sessions.length === 0) {
    sessionsList.setItems(["(sessions)"])
    sessionsList.select(0)
    sessionsList.style.fg = "gray" as any
    return null
  }

  sessionsList.setItems(formatSessionsWithStatus(sessions, statusMap))
  sessionsList.select(0)
  sessionsList.style.fg = undefined as any
  return sessions[0].claudeCodeSessionId
}

export async function refreshSessionsForSelectedProject(
  sessionsList: Widgets.ListElement,
  screen: Widgets.Screen,
  projectName: string | null,
  statusMap: JobStatusMap
): Promise<Session[]> {
  if (projectName === null) {
    setSessionListFromSessions(sessionsList, [], statusMap)
    return []
  }

  const allSessions = await ListSessionsUseCase.ListSessions(projectName)
  const filtered = allSessions.filter((s) => s.project.name === projectName)

  setSessionListFromSessions(sessionsList, filtered, statusMap)
  screen.render()

  return filtered
}
