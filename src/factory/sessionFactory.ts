import { Message } from "../domain/entities/Message.ts"
import { Project } from "../domain/entities/Project.ts"
import { Session } from "../domain/entities/Session.ts"

export class SessionFactory {
  sessionJson: any

  constructor(sessionJson: any) {
    this.sessionJson = sessionJson
  }

  generate() {
    const project = new Project(this.sessionJson["project"]["path"], this.sessionJson["project"]["name"])
    const session = new Session(
      project,
      this.sessionJson["claudeCodeSessionId"],
      this.sessionJson["name"],
      this.sessionJson["status"],
      this.sessionJson["messages"]?.map((message: any) => {
        return new Message({ messenger: message["messenger"], content: message["content"] })
      }) ?? []
    )

    return session
  }
}
