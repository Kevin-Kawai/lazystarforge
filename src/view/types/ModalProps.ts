import type { Widgets } from "neo-blessed"

/**
 * Props for the Error Modal component
 */
export interface ErrorModalProps {
  screen: Widgets.Screen
  message: string
  onClose: () => void
}

/**
 * Props for the New Session Modal component
 */
export interface NewSessionModalProps {
  screen: Widgets.Screen
  projectName: string | null
  onSubmit: (message: string) => void
}

/**
 * Props for the Delete Session Modal component
 */
export interface DeleteSessionModalProps {
  screen: Widgets.Screen
  sessionId: string
  onConfirm: () => Promise<void>
}

/**
 * Props for the New Project Modal component
 */
export interface NewProjectModalProps {
  screen: Widgets.Screen
  onSubmit: (name: string, path: string) => Promise<void>
}
