import type { JobStatus } from "../../backgroundWorker/sessionJobManager.ts"

export interface AppState {
  selectedProjectName: string | null

  selectedSessionId: string | null

  statusBySession: Map<string, JobStatus>
}

export type JobStatusMap = Map<string, JobStatus>
