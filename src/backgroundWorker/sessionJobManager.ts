import { EventEmitter } from "node:events"
import { ProjectRepository } from "../repository/projectRepository.ts";
import { ClaudeCodeGateway } from "../gateway/ClaudeCodeGateway.ts";
import { SessionRepository } from "../repository/sessionRepository.ts";
import { Session, type ISession } from "../domain/entities/Session.ts";

export type JobStatus = "running" | "idle" | "error" | "creating"

export type JobEvent =
  | { type: "session_updated"; projectName: string; sessionId: string }
  | { type: "session_status"; projectName: string; sessionId: string; status: JobStatus }
  | { type: "session_changed"; projectName: string }
  | { type: "session_creating"; projectName: string; tempSessionId: string }
  | { type: "session_created"; projectName: string; tempSessionId: string; realSessionId: string }

class SessionJobManager extends EventEmitter {
  private running = new Set<string>()
  private saveChain = new Map<string, Promise<void>>()

  startFollowupMessage(args: { projectName: string; sessionId: string; content: string }) {
    const key = `${args.projectName}:${args.sessionId}`
    if (this.running.has(key)) return
    this.running.add(key)
    void this.run(args).finally(() => this.running.delete(key))
  }

  startNewSession(args: { projectName: string; sessionName: string, initialMessage: string }) {
    const key = `${args.projectName}:__create_sessions__`
    if (this.running.has(key)) return
    this.running.add(key)
    void this.runCreateSession(args).finally(() => this.running.delete(key))
  }

  private emitEvent(e: JobEvent) {
    this.emit("event", e)
  }

  private async run({ projectName, sessionId, content }: { projectName: string, sessionId: string, content: string }) {
    this.emitEvent({ type: "session_status", projectName, sessionId, status: "running" } satisfies JobEvent)

    try {
      const project = await ProjectRepository.find(projectName)
      const session = project.sessions.find(s => s.claudeCodeSessionId === sessionId)
      if (session === undefined) throw new Error("invalid session")
      project.sendUserMessage(content, sessionId)
      await this.queueSave(session)
      this.emitEvent({ type: "session_updated", projectName, sessionId } satisfies JobEvent)

      for await (const event of ClaudeCodeGateway.streamMessage(project.path, content, sessionId)) {
        if (event.type !== "assistant_text") continue
        project.sendAssistantMessage(event.text, event.sessionId)

        const session = project.sessions.find(s => s.claudeCodeSessionId === event.sessionId)
        if (session) await this.queueSave(session)
        this.emitEvent({ type: "session_updated", projectName, sessionId: event.sessionId } satisfies JobEvent)
      }

      this.emitEvent({ type: "session_status", projectName, sessionId, status: "idle" } satisfies JobEvent)
    } catch {
      this.emitEvent({ type: "session_status", projectName, sessionId, status: "error" } satisfies JobEvent)
    }
  }

  private async runCreateSession({ projectName, sessionName, initialMessage }: { projectName: string; sessionName: string; initialMessage: string }) {
    const project = await ProjectRepository.find(projectName)

    // Create a temporary ID and emit an event for the UI to show a placeholder
    const tempSessionId = `creating-${Date.now()}`
    this.emitEvent({ type: "session_creating", projectName, tempSessionId } satisfies JobEvent)
    this.emitEvent({ type: "session_status", projectName, sessionId: tempSessionId, status: "creating" } satisfies JobEvent)

    let createdSessionId: string | null = null
    try {
      for await (const event of ClaudeCodeGateway.streamMessage(project.path, initialMessage)) {
        if (event.type !== "assistant_text") continue

        if (!createdSessionId) {
          createdSessionId = event.sessionId

          // Create the real session with the actual session ID
          const session = new Session(project, createdSessionId, sessionName)
          session.sendUserMessage(initialMessage)
          session.sendAssistantMessage(event.text)
          await this.queueSave(session)

          project.addSession(session)
          await ProjectRepository.save(project)

          // Notify UI that placeholder should be replaced with real session
          this.emitEvent({ type: "session_created", projectName, tempSessionId, realSessionId: createdSessionId } satisfies JobEvent)
          this.emitEvent({ type: "session_changed", projectName })
          this.emitEvent({ type: "session_updated", projectName, sessionId: createdSessionId })
          this.emitEvent({ type: "session_status", projectName, sessionId: createdSessionId, status: "running" } satisfies JobEvent)
          continue
        }

        const session = project.sessions.find(s => s.claudeCodeSessionId === createdSessionId)
        if (!session) throw new Error("session not found in project")

        session.sendAssistantMessage(event.text)
        await this.queueSave(session)
        this.emitEvent({ type: "session_updated", projectName, sessionId: createdSessionId })
      }

      if (createdSessionId) {
        this.emitEvent({ type: "session_status", projectName, sessionId: createdSessionId, status: "idle" } satisfies JobEvent)
      }
    } catch (error) {
      // If we have a real session ID, mark it as error, otherwise mark the placeholder
      const sessionIdToMark = createdSessionId || tempSessionId
      this.emitEvent({ type: "session_status", projectName, sessionId: sessionIdToMark, status: "error" } satisfies JobEvent)
    }
  }

  private queueSave(session: ISession) {
    const key = session.claudeCodeSessionId
    const prev = this.saveChain.get(key) ?? Promise.resolve()
    const next = prev.then(() => SessionRepository.save(session))
    this.saveChain.set(key, next.catch(() => { }))
    return next
  }
}

export const BackgroundJobs = new SessionJobManager()
