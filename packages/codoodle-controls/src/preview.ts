/* eslint-disable @typescript-eslint/ban-ts-comment */
import ScrollBar, { ScrollOrientation } from "./controls/ScrollBar"

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
