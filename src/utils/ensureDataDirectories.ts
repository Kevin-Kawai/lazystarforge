import fs from "node:fs/promises"
import os from "node:os"
import path from "node:path"

const DATA_ROOT = path.join(os.homedir(), ".lazystarforge", "data")
const PROJECTS_DIR = path.join(DATA_ROOT, "projects")
const SESSIONS_DIR = path.join(DATA_ROOT, "sessions")

export async function ensureDataDirectories(): Promise<void> {
  await fs.mkdir(DATA_ROOT, { recursive: true })
  await fs.mkdir(PROJECTS_DIR, { recursive: true })
  await fs.mkdir(SESSIONS_DIR, { recursive: true })
}

export function getDataPath(): string {
  return DATA_ROOT
}

export function getProjectsPath(): string {
  return PROJECTS_DIR
}

export function getSessionsPath(): string {
  return SESSIONS_DIR
}
