/* eslint-disable @typescript-eslint/ban-ts-comment */
import Grid from "./controls/Grid"
import type GridColumn from "./controls/Grid/GridColumn"
import type GridRow from "./controls/Grid/GridRow"
import ScrollBar, { ScrollOrientation } from "./controls/ScrollBar"

{
  const grid = new Grid()
  grid.el.style.height = "600px"
  grid.columns = (function () {
    const columns: GridColumn[] = []
    for (let i = 0; i < 100; i++) {
      columns.push({
        dataField: "1",
        width: 100,
      })
    }
    return columns
  })()
  grid.rows = (function () {
    const rows: GridRow[] = []
    for (let i = 0; i < 1000000; i++) {
      rows.push({
        dataField: "1",
        width: 100,
      })
    }
    return rows
  })()
  grid.initialize()
  document.body.append(
    // @ts-ignore
    (window.grid1 = grid).el
  )
  document.body.append(document.createElement("br"))
}
{
  const scrollBar = new ScrollBar(ScrollOrientation.Vertical)
  scrollBar.el.style.height = "200px"
  scrollBar.maximum = 5000
  scrollBar.addEventListener("valueChanged", (e) =>
    console.log("VerticalScrollBar1", "valueChanged", e.detail.newValue)
  )
  scrollBar.initialize(4980)
  document.body.append(
    // @ts-ignore
    (window.verticalScrollBar1 = scrollBar).el
  )
  document.body.append(document.createElement("br"))
}

{
  const scrollBar = new ScrollBar(ScrollOrientation.Vertical)
  scrollBar.el.style.height = "200px"
  scrollBar.addEventListener("valueChanged", (e) =>
    console.log("VerticalScrollBar2", "valueChanged", e.detail.newValue)
  )
  scrollBar.initialize()
  document.body.append(
    // @ts-ignore
    (window.verticalScrollBar2 = scrollBar).el
  )
  document.body.append(document.createElement("br"))
}

{
  const scrollBar = new ScrollBar(ScrollOrientation.Horizontal)
  scrollBar.el.style.width = "200px"
  scrollBar.maximum = 10000
  scrollBar.addEventListener("valueChanged", (e) =>
    console.log("HorizontalScrollBar1", "valueChanged", e.detail.newValue)
  )
  scrollBar.initialize()
  document.body.append(
    // @ts-ignore
    (window.horizontalScrollBar1 = scrollBar).el
  )
  document.body.append(document.createElement("br"))
}

{
  const scrollBar = new ScrollBar(ScrollOrientation.Horizontal)
  scrollBar.el.style.width = "200px"
  scrollBar.addEventListener("valueChanged", (e) =>
    console.log("HorizontalScrollBar2", "valueChanged", e.detail.newValue)
  )
  scrollBar.initialize()
  document.body.append(
    // @ts-ignore
    (window.horizontalScrollBar2 = scrollBar).el
  )
  document.body.append(document.createElement("br"))
}
