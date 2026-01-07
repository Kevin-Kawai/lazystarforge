import type { Widgets } from "neo-blessed"

export interface ProjectsListCallbacks {
  onProjectSelected: (projectName: string) => Promise<void>
  onNewProjectRequest: () => void
  onDeleteProjectRequest: () => void
  sessionsList: Widgets.ListElement
}

export function attachProjectsListHandlers(
  projectsList: Widgets.ListElement,
  callbacks: ProjectsListCallbacks
): void {
  const { onProjectSelected, onNewProjectRequest, onDeleteProjectRequest, sessionsList } = callbacks

  projectsList.on("select item", async (item, index) => {
    const itemText = item.getText()

    if (itemText.includes("no projects")) {
      return
    }

    await onProjectSelected(itemText)
  })

  projectsList.key(["tab"], () => {
    if (projectsList.screen.focused === projectsList) {
      sessionsList.focus()
    } else {
      projectsList.focus()
    }
  })

  projectsList.key("p", () => {
    onNewProjectRequest()
  })

  projectsList.key("d", () => {
    onDeleteProjectRequest()
  })
}
