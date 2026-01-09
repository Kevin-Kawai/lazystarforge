import blessed from "neo-blessed"

export function createInput(screen: blessed.Widgets.Screen): blessed.Widgets.TextboxElement {
  return blessed.textbox({
    parent: screen,
    bottom: 0,
    left: 0,
    width: "100%",
    height: 3,
    border: "line",
    label: "Input ",
    inputOnFocus: true,
    keys: true,
    mouse: true,
    style: {
      focus: { border: { fg: "green" } }
    }
  })
}
