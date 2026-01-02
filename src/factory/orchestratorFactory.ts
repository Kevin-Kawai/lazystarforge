import { EMessenger, Message } from "../domain/entities/Message.ts"
import { Orchestrator } from "../domain/entities/Orchestrator.ts"
import { Project } from "../domain/entities/Project.ts"
import { ProjectManager } from "../domain/entities/ProjectManager.ts"
import { ESessionStatus, Session } from "../domain/entities/Session.ts"

export class OrchestratorFactory {
  projectsJson: any
  sessionsJson: any

  constructor(projects: any, sessions: any) {
    this.projectsJson = projects
    this.sessionsJson = sessions
  }

  generate() {
    const projects = this.parseProjects(this.projectsJson)
    const sessions = this.parseSessions(this.sessionsJson)

    return new Orchestrator(projects, sessions)
  }

  private parseProjects(projectsJson: any) {
    const projects = projectsJson.map((json: any) => {
      return new Project(json["path"], json["name"])
    })

    return new ProjectManager(projects)
  }

  private parseSessions(sessionsJson: any) {
    const sessions = sessionsJson.map((json: any) => {
      const status = this.parseSessionStatus(json["status"])
      const project = new Project(json["project"]["path"], json["project"]["name"])
      const messages = this.parseMessages(json["messages"])
      return new Session(status, json["worktree"], project, messages)
    })

    return sessions
  }

  private parseSessionStatus(input: string): ESessionStatus {
    if ((Object.values(ESessionStatus) as string[]).includes(input)) {
      return input as ESessionStatus
    }
    throw new Error("invalid session status")
  }

  private parseMessages(messagesJson: any) {
    const messages = messagesJson.map((json: any) => {
      const messenger = this.parseMessenger(json["messenger"])
      return new Message({ messenger, content: json["content"] })
    })

    return messages
  }

  private parseMessenger(input: string): EMessenger {
    if ((Object.values(EMessenger) as string[]).includes(input)) {
      return input as EMessenger
    }
    throw new Error("invalid messege messenger")
  }
}
