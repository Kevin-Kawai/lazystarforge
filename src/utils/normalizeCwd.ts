import os from "node:os"
import path from "node:path"
import fs from "node:fs"

export function normalizeCwd(p: string) {
  const expanded =
    p.startsWith("~/") ? path.join(os.homedir(), p.slice(2)) :
      p === "~" ? os.homedir() :
        p

  const abs = path.resolve(expanded)

  if (!fs.existsSync(abs) || !fs.statSync(abs).isDirectory()) {
    throw new Error(`Invalid cwd (does not exist or not a directory): ${abs}`)
  }

  return abs
}
