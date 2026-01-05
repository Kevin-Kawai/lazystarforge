import blessed from "neo-blessed"

export function createTranscript(screen: blessed.Widgets.Screen): blessed.Widgets.BoxElement {
  return blessed.box({
    parent: screen,
    top: 1,
    left: "30%-1",
    width: "70%+1",
    height: "100%-4",
    border: "line",
    label: " Transcript ",
    tags: true,
    scrollable: true,
    alwaysScroll: true,
    keys: true,
    mouse: true,
    vi: true,
    scrollbar: { ch: " ", style: { inverse: true } }
  })
}
