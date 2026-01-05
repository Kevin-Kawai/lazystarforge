import blessed from "neo-blessed"
import type { Project } from "../../domain/entities/Project.ts"

export function createProjectsList(
  screen: blessed.Widgets.Screen,
  projects: Project[]
): blessed.Widgets.ListElement {
  return blessed.list({
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
}
