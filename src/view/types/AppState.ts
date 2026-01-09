import type { JobStatus } from "../../backgroundWorker/sessionJobManager.ts"

export interface AppState {
  selectedProjectName: string | null

  selectedSessionId: string | null

  statusBySession: Map<string, JobStatus>

  // Map of project name to array of placeholder session IDs
  placeholderSessions: Map<string, string[]>
}

export type JobStatusMap = Map<string, JobStatus>
