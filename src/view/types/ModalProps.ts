import type Widgets from "neo-blessed"

export interface ErrorModalProps {
  screen: Widgets.Screen
  message: string
  onClose: () => void
}

export interface NewSessionModalProps {
  screen: Widgets.Screen
  projectName: string | null
  onSubmit: (message: string) => void
}

export interface DeleteSessionModalProps {
  screen: Widgets.Screen
  sessionId: string
  onConfirm: () => Promise<void>
}

export interface NewProjectModalProps {
  screen: Widgets.Screen
  onSubmit: (name: string, path: string) => Promise<void>
}
