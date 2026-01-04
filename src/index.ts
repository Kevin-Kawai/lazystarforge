#!/usr/bin/env node

import blessed from "neo-blessed"
import { ListProjectsUseCase } from "./usecase/listProjectsUseCase.ts"
import { ListSessionsUseCase } from "./usecase/listSessionsUseCase.ts"
import { ListMessagesUseCase } from "./usecase/listMessagesUseCase.ts"
import { CreateSessionUseCase } from "./usecase/createSessionUseCase.ts"
import { CreateProjectUseCase } from "./usecase/createProjectUseCase.ts"
import { BackgroundJobs } from "./backgroundWorker/sessionJobManager.ts"

const projects = await ListProjectsUseCase.listProjects()

// Safe defaults for empty state
let selectedProjectName: string | null = projects.length > 0 ? projects[0].name : null
let selectedSessionId: string | null = null

// Only fetch sessions if we have a project
const sessions = selectedProjectName
  ? await ListSessionsUseCase.ListSessions(selectedProjectName)
  : []

// Set selected session if sessions exist
if (sessions.length > 0) {
  selectedSessionId = sessions[0].claudeCodeSessionId
}

const screen = blessed.screen({ smartCSR: true, title: "Lazy StarForge (POC)" })

const header = blessed.box({
  parent: screen,
  top: 0,
  left: 0,
  height: 1,
  width: "100%",
  tags: true,
  content: "{bold}Lazy StarForge{/bold} (q quit, n new, j/k move, Enter Select, type below + Enter)"
})

const projectsList = blessed.list({
  parent: screen,
  top: 1,
  left: 0,
  width: "30%-1",
  height: "30%",
  border: "line",
  label: "Projects ",
  keys: true,
  mouse: true,
  vi: true,
  tags: true,
  style: { selected: { inverse: true } },
  items: projects.length > 0
    ? projects.map((project) => project.name)
    : ["{gray-fg}(no projects - press 'p' to create){/gray-fg}"]
})

const sessionsList = blessed.list({
  parent: screen,
  top: "30%",
  left: 0,
  width: "30%-1",
  height: "30%",
  border: "line",
  label: "Sessions ",
  keys: true,
  mouse: true,
  vi: true,
  tags: true,
  style: { selected: { inverse: true } },
  items: sessions.length > 0
    ? sessions.map((s) => s.claudeCodeSessionId)
    : ["{gray-fg}(no sessions - press 'n' to create){/gray-fg}"]
})

const transcript = blessed.box({
  parent: screen,
  top: 1,
  left: "30%-1",
  width: "70%+1",
  height: "100%-4",
  border: "line",
  label: " Transcript ",
  tags: true,
  scrollable: true,
  alwaysScroll: true,
  keys: true,
  mouse: true,
  vi: true,
  scrollbar: { ch: " ", style: { inverse: true } }
})

const input = blessed.textbox({
  parent: screen,
  bottom: 0,
  left: 0,
  width: "100%",
  height: 3,
  border: "line",
  label: "Input ",
  inputOnFocus: true,
  keys: true,
  mouse: true
})

// Set initial transcript content for empty state
if (projects.length === 0) {
  transcript.setContent(
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
} else if (selectedSessionId === null) {
  transcript.setContent(
    "{center}No session selected{/center}\n\n" +
    "Press {cyan-fg}'n'{/cyan-fg} to create a new session."
  )
}

function setTranscriptContent(messageThread: string) {
  transcript.setContent(messageThread)
  transcript.setScrollPerc(100)
}

async function refreshMessagesForSelectedSession() {
  if (selectedSessionId === null || selectedProjectName === null) {
    transcript.setContent("")
    transcript.setScrollPerc(100)
    return
  }
  const messages = await ListMessagesUseCase.listMessages(selectedProjectName, selectedSessionId)

  const messageThread = messages.reduce((acc, message) => {
    return acc.concat(message.messenger + "\n" + message.content + "\n\n")
  }, "")

  setTranscriptContent(messageThread)
  screen.render()
}

function setSessionListFromSessions(list: typeof sessions) {
  if (list.length === 0) {
    sessionsList.setItems(["(sessions)"])
    sessionsList.select(0)
    sessionsList.style.fg = "gray" as any
    selectedSessionId = null
    return
  }

  sessionsList.setItems(list.map(s => s.claudeCodeSessionId))
  sessionsList.select(0)
  sessionsList.style.fg = undefined as any
  selectedSessionId = list[0].claudeCodeSessionId
}

async function refreshSessionsForSelectedProject() {
  if (selectedProjectName === null) {
    setSessionListFromSessions([])
    return
  }
  const allSessions = await ListSessionsUseCase.ListSessions(selectedProjectName)

  const filtered = allSessions.filter((s) => s.project.name === selectedProjectName)

  setSessionListFromSessions(filtered)
  screen.render()
}

projectsList.focus()

projectsList.on("select item", async (item, index) => {
  const itemText = item.getText()

  // Ignore if it's the placeholder text
  if (itemText.includes("no projects") || projects.length === 0) {
    return
  }

  selectedProjectName = itemText
  await refreshSessionsForSelectedProject()
  await refreshMessagesForSelectedSession()
})

await refreshMessagesForSelectedSession()

projectsList.key(["tab"], () => {
  if (screen.focused === projectsList) sessionsList.focus()
  else projectsList.focus()
})

sessionsList.key(["tab"], () => {
  if (screen.focused === projectsList) sessionsList.focus()
  else projectsList.focus()
})

sessionsList.on("select item", async (item, index) => {
  const itemText = item.getText()

  // Ignore if it's the placeholder text
  if (itemText.includes("no sessions") || sessions.length === 0) {
    selectedSessionId = null
    await refreshMessagesForSelectedSession()
    return
  }

  selectedSessionId = itemText

  await refreshMessagesForSelectedSession()

  screen.render()
})

transcript.key("j", () => {
  transcript.scroll(1)
  screen.render()
})

transcript.key("k", () => {
  transcript.scroll(-1)
  screen.render()
})

transcript.key("tab", () => {
  input.focus()
  input.readInput()
  screen.render()
})

transcript.key("S-tab", () => {
  sessionsList.focus()
  screen.render()
})

input.on("submit", async (value: string) => {
  const text = (value ?? "").trim()
  input.clearValue()
  if (!text) return

  if (selectedSessionId === null) {
    transcript.setContent(
      "{center}{red-fg}No session selected{/red-fg}{/center}\n\n" +
      "Press {cyan-fg}'n'{/cyan-fg} to create a new session first."
    )
    screen.render()
    return
  }

  BackgroundJobs.startFollowupMessage({
    projectName: selectedProjectName!,
    sessionId: selectedSessionId,
    content: text
  })

  void refreshSelectedSessionDebounce()
  // await createFollowupMessageUseCase.sendMessage(text, selectedProjectName, selectedSessionId)
  // await refreshMessagesForSelectedSession()
  // screen.render()
})

function focusPreviousFromInput() {
  transcript.focus()
  screen.render()
}

input.key(["S-tab", "backtab"], () => {
  input.cancel()
  focusPreviousFromInput()
})

function openNewSessionPrompt() {
  // Prevent creating session without a project
  if (selectedProjectName === null) {
    const errorModal = blessed.box({
      parent: screen,
      top: "center",
      left: "center",
      width: 50,
      height: 5,
      border: "line",
      label: " Error ",
      tags: true,
      content: "\n{center}Please create a project first (press 'p'){/center}",
      style: { border: { fg: "red" } }
    })

    errorModal.key(["enter", "escape"], () => {
      errorModal.detach()
      projectsList.focus()
      screen.render()
    })

    errorModal.focus()
    screen.render()
    return
  }

  const modal = blessed.box({
    parent: screen,
    top: "center",
    left: "center",
    width: "60%",
    height: 7,
    border: "line",
    label: " New session ",
    tags: true,
    style: { border: { fg: "cyan" } }
  })

  blessed.box({
    parent: modal,
    top: 1,
    left: 1,
    height: 1,
    content: "Enter initial message (Esc to cancel)"
  })

  const prompt = blessed.textbox({
    parent: modal,
    top: 3,
    left: 1,
    width: "100%-3",
    height: 3,
    border: "line",
    inputOnFocus: true,
    keys: true,
    mouse: true
  })

  const close = () => {
    prompt.cancel()
    modal.detach()
    sessionsList.focus()
    screen.render()
  }

  prompt.key("escape", close)

  prompt.on("submit", async (value: string) => {
    const text = (value ?? "").trim()
    if (!text) return close()
    // await CreateSessionUseCase.createSession(selectedProjectName, text)

    // await refreshSessionsForSelectedProject()
    // await refreshMessagesForSelectedSession()
    BackgroundJobs.startNesSession({
      projectName: selectedProjectName!,
      initialMessage: text
    })
    close()
  })

  prompt.focus()
  prompt.readInput()
  screen.render()
}

sessionsList.key("n", () => {
  openNewSessionPrompt()
})

function openNewProjectPrompt() {
  const modal = blessed.box({
    parent: screen,
    top: "center",
    left: "center",
    width: "70%",
    height: 11,
    border: "line",
    label: " New project ",
    tags: true,
    style: { border: { fg: "cyan " } }
  })

  blessed.box({
    parent: modal,
    top: 1,
    left: 1,
    height: 1,
    content: "Project name:"
  })

  const nameInput = blessed.textbox({
    parent: modal,
    top: 2,
    left: 1,
    width: "100%-3",
    height: 3,
    border: "line",
    inputOnFocus: true,
    keys: true,
    mouse: true,
  })

  blessed.box({
    parent: modal,
    top: 5,
    left: 1,
    height: 1,
    content: "Project path:",
  })

  const pathInput = blessed.textbox({
    parent: modal,
    top: 6,
    left: 1,
    width: "100%-3",
    height: 3,
    border: "line",
    inputOnFocus: true,
    keys: true,
    mouse: true,
  })

  const close = () => {
    nameInput.cancel()
    pathInput.cancel()
    modal.detach()
    projectsList.focus()
    screen.render()
  }
  nameInput.key("escape", close)
  pathInput.key("escape", close)

  nameInput.on("submit", (value: string) => {
    const name = (value ?? "").trim()
    if (!name) return
    pathInput.focus()
    pathInput.readInput()
    screen.render()
  })

  pathInput.key(["S-tab", "backtab"], () => {
    pathInput.cancel()
    nameInput.focus()
    nameInput.readInput()
    screen.render()
  })

  pathInput.on("submit", async (value: string) => {
    const name = (nameInput.getValue() ?? "").trim()
    const p = (value ?? "").trim()
    if (!name || !p) return close()

    try {
      await CreateProjectUseCase.createProject(name, p)

      const updatedProjects = await ListProjectsUseCase.listProjects()
      projectsList.setItems(updatedProjects.map(pr => pr.name))
      projectsList.select(0)

      selectedProjectName = updatedProjects[0]?.name ?? null

      if (selectedProjectName) {
        await refreshSessionsForSelectedProject()
        await refreshMessagesForSelectedSession()
      }
    } finally {
      close()
    }
  })

  nameInput.focus()
  nameInput.readInput()
  screen.render()
}

let refreshInFlight: Promise<void> | null = null
let refreshQueued = false

async function refreshSelectedSessionDebounce() {
  if (refreshInFlight) {
    refreshQueued = true
    return
  }

  refreshInFlight = (async () => {
    await refreshMessagesForSelectedSession()
  })()

  try {
    await refreshInFlight
  } finally {
    refreshInFlight = null
    if (refreshQueued) {
      refreshQueued = false
      void refreshSelectedSessionDebounce()
    }
  }
}

BackgroundJobs.on("event", (e: any) => {
  if (e.type === "session_changed") {
    if (e.projectName === selectedProjectName) {
      void refreshSessionsForSelectedProject()
    }
  }

  if (e.type === "session_updated") {
    if (e.projectName === selectedProjectName && e.sessionId === selectedSessionId) {
      void refreshSelectedSessionDebounce()
    }
  }
})

projectsList.key("p", () => {
  openNewProjectPrompt()
})

sessionsList.key("enter", () => {
  transcript.focus()
  screen.render()
})

screen.key(["q", "C-c"], () => process.exit(0))

screen.render()
