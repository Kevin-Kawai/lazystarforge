import type { Widgets } from "neo-blessed"
import type { Project } from "../../domain/entities/Project.ts"
import type { Session } from "../../domain/entities/Session.ts"
import type { JobStatusMap } from "./AppState.ts"

/**
 * Props for the Header component
 */
export interface HeaderProps {
  screen: Widgets.Screen
}

/**
 * Props for the ProjectsList component
 */
export interface ProjectsListProps {
  screen: Widgets.Screen
  projects: Project[]
}

/**
 * Props for the SessionsList component
 */
export interface SessionsListProps {
  screen: Widgets.Screen
  sessions: Session[]
  statusMap: JobStatusMap
}

/**
 * Props for the Transcript component
 */
export interface TranscriptProps {
  screen: Widgets.Screen
}

/**
 * Props for the Input component
 */
export interface InputProps {
  screen: Widgets.Screen
}
