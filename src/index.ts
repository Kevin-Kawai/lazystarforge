#!/usr/bin/env node

import blessed from "neo-blessed"
import { ListProjectsUseCase } from "./usecase/listProjectsUseCase.ts"
import { ListSessionsUseCase } from "./usecase/listSessionsUseCase.ts"
import { ListMessagesUseCase } from "./usecase/listMessagesUseCase.ts"
import { CreateProjectUseCase } from "./usecase/createProjectUseCase.ts"
import { BackgroundJobs, type JobStatus, type JobEvent } from "./backgroundWorker/sessionJobManager.ts"

const projects = await ListProjectsUseCase.listProjects()
const sessions = await ListSessionsUseCase.ListSessions(projects[0].name)

let selectedProjectName: string = projects[0].name
let selectedSessionId: string | null = sessions[0].claudeCodeSessionId
const statusBySessions = new Map<string, JobStatus>()

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
  style: { selected: { inverse: true } },
  items: projects.map((project) => project.name)
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
  style: { selected: { inverse: true } },
  items: sessions.map((s) => s.claudeCodeSessionId)
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

function setTranscriptContent(messageThread: string) {
  transcript.setContent(messageThread)
  transcript.setScrollPerc(100)
}

async function refreshMessagesForSelectedSession() {
  if (selectedSessionId === null) {
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

  // sessionsList.setItems(list.map(s => s.claudeCodeSessionId))
  sessionsList.setItems(list.map((session) => {
    const st = statusBySessions.get(session.claudeCodeSessionId)
    const suffix =
      st === "running" ? " [⏳]" :
        st === "error" ? " [!]" :
          ""
    return `${session.claudeCodeSessionId}${suffix}`
  }))

  sessionsList.select(0)
  sessionsList.style.fg = undefined as any
  selectedSessionId = list[0].claudeCodeSessionId
}

async function refreshSessionsForSelectedProject() {
  if (selectedSessionId === null) return
  const allSessions = await ListSessionsUseCase.ListSessions(selectedProjectName)

  const filtered = allSessions.filter((s) => s.project.name === selectedProjectName)

  setSessionListFromSessions(filtered)
  screen.render()
}

projectsList.focus()

projectsList.on("select item", async (item, index) => {
  selectedProjectName = item.getText()
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
  selectedSessionId = item.getText()

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

  if (selectedSessionId === null) return
  BackgroundJobs.startFollowupMessage({
    projectName: selectedProjectName,
    sessionId: selectedSessionId,
    content: text
  })

  void refreshSelectedSessionDebounce()
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
    BackgroundJobs.startNewSession({
      projectName: selectedProjectName,
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

      selectedProjectName = updatedProjects[0]?.name ?? selectedProjectName
      await refreshSessionsForSelectedProject()
      await refreshMessagesForSelectedSession()
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

BackgroundJobs.on("event", (e: JobEvent) => {
  if (e.type === "session_status") {
    statusBySessions.set(e.sessionId, e.status)

    void refreshSessionsForSelectedProject()

    if (e.projectName === selectedProjectName && e.sessionId === selectedSessionId) {
      void refreshSelectedSessionDebounce()
    }
    return
  }

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
