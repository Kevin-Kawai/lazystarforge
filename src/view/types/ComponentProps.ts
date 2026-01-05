import type Widgets from "neo-blessed"
import type { Project } from "../../domain/entities/Project.ts"
import type { Session } from "../../domain/entities/Session.ts"
import type { JobStatusMap } from "./AppState.ts"

export interface HeaderProps {
  screen: Widgets.Screen
}

export interface ProjectsListProps {
  screen: Widgets.Screen
  projects: Project[]
}

export interface SessionsListProps {
  screen: Widgets.Screen
  sessions: Session[]
  statusMap: JobStatusMap
}

export interface TranscriptProps {
  screen: Widgets.Screen
}

export interface InputProps {
  screen: Widgets.Screen
}
