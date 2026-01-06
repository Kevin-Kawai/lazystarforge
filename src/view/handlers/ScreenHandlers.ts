import type { Widgets } from "neo-blessed"

export function attachScreenHandlers(screen: Widgets.Screen): void {
  screen.key(["q", "C-c"], () => process.exit(0))
}
