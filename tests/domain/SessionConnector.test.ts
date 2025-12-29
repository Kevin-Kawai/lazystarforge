import { describe, it, expect } from "vitest"
import { SessionConnector } from "../../src/domain/entities/SessionConnector"

describe("SessionConnector", () => {
  it("adds a new project", () => {
    const sc = new SessionConnector
    sc.newProject('./projects/test', 'test')
    expect(sc.listProjects()).toHaveLength(1)
    expect(sc.listProjects()[0]).toMatchObject({
      path: "./projects/test",
      name: "test"
    })
  })

  it("adds a new session", () => {
    const sc = new SessionConnector
    sc.newProject('./projects/test', 'test')
    const project = sc.listProjects()[0]
    sc.newSession('refactor_home_page', project)
    expect(sc.listSessions()).toHaveLength(1)
    expect(sc.listSessions()[0]).toMatchObject({
      worktree: 'refactor_home_page',
      project: { path: "./projects/test", name: "test" }
    })
  })

  it("attaches to a session", () => {
    const sc = new SessionConnector
    sc.newProject('./projects/test', 'test')
    const project = sc.listProjects()[0]
    sc.newSession('refactor_home_page', project)
    const session = sc.listSessions()[0]
    sc.attachToSession(session)
    expect(sc.currentAttachedSession).toMatchObject({
      worktree: 'refactor_home_page',
      project: { path: "./projects/test", name: "test" }
    })
  })

  it("detaches from a session", () => {
    const sc = new SessionConnector
    sc.newProject('./projects/test', 'test')
    const project = sc.listProjects()[0]
    sc.newSession('refactor_home_page', project)
    const session = sc.listSessions()[0]
    sc.attachToSession(session)
    expect(sc.currentAttachedSession).toMatchObject({
      worktree: 'refactor_home_page',
      project: { path: "./projects/test", name: "test" }
    })
    sc.detachFromSession()
    expect(sc.currentAttachedSession).toEqual(null)
  })
})

