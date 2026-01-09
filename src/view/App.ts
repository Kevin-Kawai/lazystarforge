import blessed from "neo-blessed"
import { ListProjectsUseCase } from "../usecase/listProjectsUseCase.ts"
import { ListSessionsUseCase } from "../usecase/listSessionsUseCase.ts"
import { CreateProjectUseCase } from "../usecase/createProjectUseCase.ts"
import { DeleteSessionUseCase } from "../usecase/deleteSessionUseCase.ts"
import { DeleteProjectUseCase } from "../usecase/deleteProjectUseCase.ts"
import { BackgroundJobs } from "../backgroundWorker/sessionJobManager.ts"

// Types
import type { AppState } from "./types/AppState.ts"

// Components
import { createHeader } from "./components/Header.ts"
import { createProjectsList } from "./components/ProjectsList.ts"
import { createSessionsList } from "./components/SessionsList.ts"
import { createTranscript } from "./components/Transcript.ts"
import { createInput } from "./components/Input.ts"

// Modals
import { createErrorModal } from "./modals/ErrorModal.ts"
import { openNewSessionModal } from "./modals/NewSessionModal.ts"
import { openDeleteSessionModal } from "./modals/DeleteSessionModal.ts"
import { openDeleteProjectModal } from "./modals/DeleteProjectModal.ts"
import { openNewProjectModal } from "./modals/NewProjectModal.ts"

// Utilities
import { generateWelcomeContent, generateNoSessionContent, generateNoSessionSelectedError } from "./utils/contentGenerators.ts"
import { createRefreshDebouncer } from "./utils/refreshDebouncer.ts"

// State Management
import { refreshMessagesForSelectedSession } from "./state/transcriptUpdaters.ts"
import { refreshSessionsForSelectedProject } from "./state/sessionListUpdaters.ts"

// Event Handlers
import { attachProjectsListHandlers } from "./handlers/ProjectsListHandlers.ts"
import { attachSessionsListHandlers } from "./handlers/SessionsListHandlers.ts"
import { attachTranscriptHandlers } from "./handlers/TranscriptHandlers.ts"
import { attachInputHandlers } from "./handlers/InputHandlers.ts"
import { attachScreenHandlers } from "./handlers/ScreenHandlers.ts"
import { attachBackgroundJobEventHandlers } from "./events/BackgroundJobEventManager.ts"

export async function initializeApp() {
  // Load initial data
  const projects = await ListProjectsUseCase.listProjects()

  // Initialize state
  const state: AppState = {
    selectedProjectName: projects.length > 0 ? projects[0].name : null,
    selectedSessionId: null,
    statusBySession: new Map()
  }

  const sessions = state.selectedProjectName
    ? await ListSessionsUseCase.ListSessions(state.selectedProjectName)
    : []

  if (sessions.length > 0) {
    state.selectedSessionId = sessions[0].claudeCodeSessionId
  }

  // Create screen
  process.env.TERM = "xterm-256color"
  const screen = blessed.screen({ smartCSR: true, title: "Lazy StarForge (POC)" })

  // Create UI components
  const header = createHeader(screen)
  const projectsList = createProjectsList(screen, projects)
  const sessionsList = createSessionsList(screen, sessions, state.statusBySession)
  const transcript = createTranscript(screen)
  const input = createInput(screen)

  // Set initial transcript content
  if (projects.length === 0) {
    transcript.setContent(generateWelcomeContent())
  } else if (state.selectedSessionId === null) {
    transcript.setContent(generateNoSessionContent())
  }

  // Create debounced refresh function
  const refreshMessagesDebounced = createRefreshDebouncer(async () => {
    await refreshMessagesForSelectedSession(
      transcript,
      screen,
      state.selectedProjectName,
      state.selectedSessionId
    )
  })

  // Helper functions for handlers
  const refreshProjects = async () => {
    const updatedProjects = await ListProjectsUseCase.listProjects()
    projectsList.setItems(updatedProjects.map(p => p.name))

    // Update selectedProjectName based on the refreshed projects
    if (updatedProjects.length > 0) {
      projectsList.select(0)
      state.selectedProjectName = updatedProjects[0].name
    } else {
      state.selectedProjectName = null
    }

    screen.render()
  }

  const refreshSessions = async () => {
    const updatedSessions = await refreshSessionsForSelectedProject(
      sessionsList,
      screen,
      state.selectedProjectName,
      state.selectedSessionId,
      state.statusBySession
    )

    // Update selectedSessionId based on the refreshed sessions
    if (updatedSessions.length === 1) {
      state.selectedSessionId = updatedSessions[0].claudeCodeSessionId
    } else if (updatedSessions.length === 0) {
      state.selectedSessionId = null
    }
  }

  const refreshMessages = async () => {
    await refreshMessagesForSelectedSession(
      transcript,
      screen,
      state.selectedProjectName,
      state.selectedSessionId
    )
  }

  // Attach event handlers
  attachProjectsListHandlers(projectsList, {
    onProjectSelected: async (projectName) => {
      state.selectedProjectName = projectName
      await refreshSessions()
      await refreshMessages()
    },
    onNewProjectRequest: () => {
      openNewProjectModal(screen, async (name, path) => {
        await CreateProjectUseCase.createProject(name, path)
        const updatedProjects = await ListProjectsUseCase.listProjects()
        projectsList.setItems(updatedProjects.map(p => p.name))
        projectsList.select(0)
        state.selectedProjectName = updatedProjects[0]?.name ?? null
        if (state.selectedProjectName) {
          await refreshSessions()
          await refreshMessages()
        }
      }, () => {
        projectsList.focus()
      })
    },
    onDeleteProjectRequest: async () => {
      if (state.selectedProjectName === null) return

      openDeleteProjectModal(
        screen,
        state.selectedProjectName,
        async () => {
          await DeleteProjectUseCase.DeleteProject(state.selectedProjectName!)
          await refreshProjects()
          // Clear selected session since project is gone
          state.selectedSessionId = null
          await refreshSessions()
          await refreshMessages()
        },
        () => {
          projectsList.focus()
        }
      )
    },
    sessionsList
  })

  attachSessionsListHandlers(sessionsList, {
    onSessionSelected: async (sessionId) => {
      state.selectedSessionId = sessionId
      await refreshMessages()
    },
    onNewSessionRequest: () => {
      if (state.selectedProjectName === null) {
        createErrorModal(screen, "Please create a project first (press 'p')", () => {
          projectsList.focus()
        })
        return
      }

      openNewSessionModal(screen, state.selectedProjectName, (message) => {
        BackgroundJobs.startNewSession({
          projectName: state.selectedProjectName!,
          initialMessage: message
        })
      }, () => {
        sessionsList.focus()
      })
    },
    onDeleteSessionRequest: async () => {
      if (state.selectedSessionId === null) return

      openDeleteSessionModal(screen, state.selectedSessionId, async () => {
        await DeleteSessionUseCase.DeleteSession(
          state.selectedProjectName!,
          state.selectedSessionId!
        )
        await refreshSessions()
        await refreshMessages()
      }, () => {
        sessionsList.focus()
      })
    },
    projectsList,
    transcript
  })

  attachTranscriptHandlers(transcript, {
    input,
    sessionsList
  })

  attachInputHandlers(input, {
    onMessageSubmit: (message) => {
      BackgroundJobs.startFollowupMessage({
        projectName: state.selectedProjectName!,
        sessionId: state.selectedSessionId!,
        content: message
      })
      void refreshMessagesDebounced()
    },
    onNoSessionError: () => {
      transcript.setContent(generateNoSessionSelectedError())
      screen.render()
    },
    transcript,
    hasSelectedSession: () => state.selectedSessionId !== null
  })

  attachScreenHandlers(screen)

  attachBackgroundJobEventHandlers(BackgroundJobs, {
    refreshSessions,
    refreshMessages: refreshMessagesDebounced,
    getSelectedProjectName: () => state.selectedProjectName,
    getSelectedSessionId: () => state.selectedSessionId,
    statusBySession: state.statusBySession
  })

  // Initial focus and data load
  projectsList.focus()
  await refreshMessages()

  return screen
}
