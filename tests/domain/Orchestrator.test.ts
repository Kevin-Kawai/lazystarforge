import { describe, it, expect } from "vitest"
import { Orchestrator } from "../../src/domain/entities/Orchestrator.ts"

describe("SessionConnector", () => {
  it("adds a new project", () => {
    const sc = new Orchestrator
    sc.newProject('./projects/test', 'test')
    expect(sc.listProjects()).toHaveLength(1)
    expect(sc.listProjects()[0]).toMatchObject({
      path: "./projects/test",
      name: "test"
    })
  })

  it("adds a new session", () => {
    const sc = new Orchestrator
    sc.newProject('./projects/test', 'test')
    const project = sc.listProjects()[0]
    sc.newSession('refactor_home_page', project)
    expect(sc.listSessions()).toHaveLength(1)
    expect(sc.listSessions()[0]).toMatchObject({
      worktree: 'refactor_home_page',
      project: { path: "./projects/test", name: "test" }
    })
  })

  it("sends a message to a session", () => {
    const sc = new Orchestrator
    sc.newProject('./projects/test', 'test')
    const project = sc.listProjects()[0]
    sc.newSession('refactor_home_page', project)
    const session = sc.listSessions()[0]
    sc.sendMessage(session, 'refactor build process')
    expect(sc.listMessages(session)).toHaveLength(1)
    expect(sc.listMessages(session)[0]).toMatchObject({
      messenger: 'user',
      content: 'refactor build process'
    })
  })

  it("lets you takeover a session", () => {
  })
})

