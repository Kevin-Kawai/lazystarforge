import { Message } from "../domain/entities/Message.ts"
import { Project } from "../domain/entities/Project.ts"
import { Session } from "../domain/entities/Session.ts"

export class ProjectFactory {
  projectJson: any

  constructor(projectJson: any) {
    this.projectJson = projectJson
  }

  generate() {
    const project = new Project(this.projectJson["path"], this.projectJson["name"])
    const sessions = this.projectJson["sessions"].map((sessionJson: any) => {
      const session = new Session(
        project,
        sessionJson["claudeCodeSessionId"],
        sessionJson["status"],
        sessionJson["messages"]?.map((message: any) => {
          return new Message({ messenger: message["messenger"], content: message["content"] })
        }) ?? []
      )

      return session
    })

    project.sessions = sessions
    return project
  }
}
