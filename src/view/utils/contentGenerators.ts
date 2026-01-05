export function generateWelcomeContent(): string {
  return (
    "{center}{bold}Welcome to Lazy StarForge!{/bold}{/center}\n\n" +
    "You don't have any projects yet.\n\n" +
    "{bold}Getting Started:{/bold}\n" +
    "1. Press {cyan-fg}'p'{/cyan-fg} to create a new project\n" +
    "2. Press {cyan-fg}'n'{/cyan-fg} to create a new session\n" +
    "3. Start chatting!\n\n" +
    "{bold}Navigation:{/bold}\n" +
    "- {cyan-fg}j/k{/cyan-fg} or arrows to move\n" +
    "- {cyan-fg}Tab{/cyan-fg} to switch panels\n" +
    "- {cyan-fg}q{/cyan-fg} to quit"
  )
}

export function generateNoSessionContent(): string {
  return (
    "{center}No session selected{/center}\n\n" +
    "Press {cyan-fg}'n'{/cyan-fg} to create a new session."
  )
}

export function generateNoSessionSelectedError(): string {
  return (
    "{center}{red-fg}No session selected{/red-fg}{/center}\n\n" +
    "Press {cyan-fg}'n'{/cyan-fg} to create a new session first."
  )
}
