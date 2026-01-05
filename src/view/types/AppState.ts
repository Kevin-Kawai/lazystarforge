import type { JobStatus } from "../../backgroundWorker/sessionJobManager.ts"

/**
 * Application state interface
 * Represents the global state of the TUI application
 */
export interface AppState {
  /** Currently selected project name, null if none selected */
  selectedProjectName: string | null

  /** Currently selected session ID, null if none selected */
  selectedSessionId: string | null

  /** Map of session IDs to their current job status */
  statusBySession: Map<string, JobStatus>
}

/**
 * Type alias for the job status map
 * Maps session IDs to their current job status (running, idle, error)
 */
export type JobStatusMap = Map<string, JobStatus>
