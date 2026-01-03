#!/usr/bin/env node

import blessed from "neo-blessed"
import { ListProjectsUseCase } from "./usecase/listProjectsUseCase.ts"
import { ListSessionsUseCase } from "./usecase/listSessionsUseCase.ts"
import { ListMessagesUseCase } from "./usecase/listMessagesUseCase.ts"
import { createFollowupMessageUseCase } from "./usecase/createFollowupMessageUseCase.ts"

const projects = await ListProjectsUseCase.listProjects()
const sessions = await ListSessionsUseCase.ListSessions()

let selectedProjectName: string = projects[0].name
let filteredSessions = sessions.filter((s) => s.project.name === selectedProjectName)
let selectedSessionId: string | null = filteredSessions[0].claudeCodeSessionId

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
  items: filteredSessions.map((s) => s.claudeCodeSessionId)
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

function setSessionListFromSessions(list: typeof sessions) {
  filteredSessions = list

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
  const messages = await ListMessagesUseCase.listMesseges(selectedSessionId)

  const messageThread = messages.reduce((acc, message) => {
    return acc.concat(message.messenger + "\n" + message.content + "\n\n")
  }, "")

  setTranscriptContent(messageThread)
  screen.render()
}

async function refreshSessionsForSelectedProject() {
  const allSessions = await ListSessionsUseCase.ListSessions()

  const filtered = allSessions.filter((s) => s.project.name === selectedProjectName)

  setSessionListFromSessions(filtered)
  screen.render()
}

projectsList.focus()

projectsList.on("select item", async (_item, index) => {
  selectedProjectName = projects[index]?.name ?? selectedProjectName
  await refreshSessionsForSelectedProject()
  await refreshMessagesForSelectedSession()
})

input.on("submit", async (value: string) => {
  const text = (value ?? "").trim()
  input.clearValue()
  if (!text) return

  if (selectedSessionId === null) return
  await createFollowupMessageUseCase.sendMessage(text, selectedSessionId)
  screen.render()
})


sessionsList.on("select item", async (_item, index) => {
  if (filteredSessions.length === 0) return

  selectedSessionId = filteredSessions[index]?.claudeCodeSessionId ?? null
  await refreshMessagesForSelectedSession()
})

transcript.key("j", () => {
  transcript.scroll(1)
  screen.render()
})

transcript.key("k", () => {
  transcript.scroll(-1)
  screen.render()
})

sessionsList.key("enter", () => {
  transcript.focus()
  screen.render()
})

transcript.key("tab", () => {
  input.focus()
  input.readInput()
  screen.render()
})

await refreshMessagesForSelectedSession()

screen.key(["q", "C-c"], () => process.exit(0))
projectsList.key(["tab"], () => {
  if (screen.focused === projectsList) sessionsList.focus()
  else projectsList.focus()
})

sessionsList.key(["tab"], () => {
  if (screen.focused === projectsList) sessionsList.focus()
  else projectsList.focus()
})

screen.render()
