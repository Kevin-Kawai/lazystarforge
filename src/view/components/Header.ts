import blessed from "neo-blessed"

export function createHeader(screen: blessed.Widgets.Screen): blessed.Widgets.BoxElement {
  return blessed.box({
    parent: screen,
    top: 0,
    left: 0,
    height: 1,
    width: "100%",
    tags: true,
    content: "{bold}Lazy StarForge{/bold} (q quit, n new, d delete, j/k move, Enter Select, type below + Enter)"
  })
}
