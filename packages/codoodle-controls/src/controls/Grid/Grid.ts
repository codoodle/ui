import "@codoodle/styles/dist/grid/grid.css"
import styles from "@codoodle/styles/dist/grid"
import { toOptimizedFunction } from "../../toOptimizedFunction"
import type IRect from "../IRect"
import type ISize from "../ISize"
import Control from "../Control"
import ScrollBar, { ScrollOrientation } from "../ScrollBar"
import type GridColumn from "./GridColumn"
import type GridRow from "./GridRow"

interface InternalGridColumn {
  origin: GridColumn
  width: number
  left: number
  right: number
}

interface InternalGridRow<T> {
  origin: T
  height: number
  top: number
  bottom: number
}

/**
 * 그리드의 인덱스 범위를 나타냅니다.
 */
export interface GridRenderingBounds {
  /**
   * 시작 행 인덱스입니다.
   */
  rowBegin: number
  /**
   * 끝 행 인덱스입니다.
   */
  rowEnd: number
  /**
   * 시작 열 인덱스입니다.
   */
  columnBegin: number
  /**
   * 끝 열 인덱스입니다.
   */
  columnEnd: number
}

class Grid<T extends GridRow = GridRow> extends Control {
  #resizeObserver: ResizeObserver
  #elWrap
  #elHead
  #elHeadFrozenColumns
  #elBody
  #elBodyFrozenColumns
  #elBodyFrozenRows
  #elBodyFrozenColumnsAndRows
  #elScrollBarHorizontal
  #elScrollBarVertical
  #elCNE
  #elCSE
  #scrollBarHorizontal
  #scrollBarVertical
  #render = toOptimizedFunction(this, this.#handleRender)
  #columns: InternalGridColumn[] = []
  #columnsOrigin: GridColumn[] = []
  #columnsWidth = 0
  #rows: InternalGridRow<T>[] = []
  #rowsOrigin: T[] = []
  #rowsHeight = 0
  #headersHeight = 30

  get columns(): GridColumn[] {
    return this.#columnsOrigin
  }
  set columns(value: GridColumn[]) {
    this.#columnsOrigin = value
    this.#columns = this.#columnsOrigin.reduce((acc, c, i) => {
      const width = c.width
      const left = acc[i - 1]?.right ?? 0
      const right = left + width
      acc.push({
        origin: c,
        width,
        left,
        right,
      })
      return acc
    }, [] as InternalGridColumn[])
    this.#columnsWidth = this.#columns[this.#columns.length - 1]?.right ?? 0
  }

  get rows(): T[] {
    return this.#rowsOrigin
  }
  set rows(value: T[]) {
    this.#rowsOrigin = value
    this.#rows = this.#rowsOrigin.reduce((acc, r, i) => {
      const height = r.height ?? 30
      const top = acc[i - 1]?.bottom ?? 0
      const bottom = top + height
      acc.push({
        origin: r,
        height,
        top,
        bottom,
      })
      return acc
    }, [] as InternalGridRow<T>[])
    this.#rowsHeight = this.#rows[this.#rows.length - 1]?.bottom ?? 0
  }

  constructor(el?: HTMLElement) {
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.target === this.el) {
          const width =
            entry.contentBoxSize[0]?.inlineSize ?? entry.contentRect.width
          const height =
            entry.contentBoxSize[0]?.blockSize ?? entry.contentRect.height
          this.measure({ width, height })
        }
        //  else if (entry.target === this.#elScrollBarHorizontal) {
        //   this.#scrollBarHorizontal.measure({
        //     width:
        //       entry.contentBoxSize[0]?.inlineSize ?? entry.contentRect.width,
        //     height:
        //       entry.contentBoxSize[0]?.blockSize ?? entry.contentRect.height,
        //   })
        // } else if (entry.target === this.#elScrollBarVertical) {
        //   this.#scrollBarVertical.measure({
        //     width:
        //       entry.contentBoxSize[0]?.inlineSize ?? entry.contentRect.width,
        //     height:
        //       entry.contentBoxSize[0]?.blockSize ?? entry.contentRect.height,
        //   })
        // }
      }
    })
    super(el, resizeObserver)
    this.#resizeObserver = resizeObserver

    this.el.classList.add(styles.grid)
    this.#elWrap = document.createElement("div")
    this.#elWrap.classList.add(styles.gridWrap)
    this.el.append(this.#elWrap)

    this.#elHead = document.createElement("div")
    this.#elHead.classList.add(styles.gridHead)
    this.#elHead.style.height = `${this.#headersHeight}px`
    this.#elWrap.append(this.#elHead)

    this.#elHeadFrozenColumns = document.createElement("div")
    this.#elHeadFrozenColumns.classList.add(
      styles.gridHead,
      styles.gridFrozenColumns
    )
    this.#elWrap.append(this.#elHeadFrozenColumns)

    this.#elBody = document.createElement("div")
    this.#elBody.classList.add(styles.gridBody)
    this.#elWrap.append(this.#elBody)

    this.#elBodyFrozenColumns = document.createElement("div")
    this.#elBodyFrozenColumns.classList.add(
      styles.gridBody,
      styles.gridFrozenColumns
    )
    this.#elWrap.append(this.#elBodyFrozenColumns)

    this.#elBodyFrozenRows = document.createElement("div")
    this.#elBodyFrozenRows.classList.add(styles.gridBody, styles.gridFrozenRows)
    this.#elWrap.append(this.#elBodyFrozenRows)

    this.#elBodyFrozenColumnsAndRows = document.createElement("div")
    this.#elBodyFrozenColumnsAndRows.classList.add(
      styles.gridBody,
      styles.gridFrozenColumns,
      styles.gridFrozenRows
    )
    this.#elWrap.append(this.#elBodyFrozenColumnsAndRows)

    this.#elScrollBarHorizontal = document.createElement("div")
    this.#elScrollBarHorizontal.classList.add(styles.gridScrollBarHorizontal)
    this.#elWrap.append(this.#elScrollBarHorizontal)
    this.#scrollBarHorizontal = new ScrollBar(
      ScrollOrientation.Horizontal,
      this.#elScrollBarHorizontal,
      this.#resizeObserver
    )

    this.#elScrollBarVertical = document.createElement("div")
    this.#elScrollBarVertical.classList.add(styles.gridScrollBarVertical)
    this.#elWrap.append(this.#elScrollBarVertical)
    this.#scrollBarVertical = new ScrollBar(
      ScrollOrientation.Vertical,
      this.#elScrollBarVertical,
      this.#resizeObserver
    )

    this.#elCNE = document.createElement("div")
    this.#elCNE.classList.add(styles.gridCNE)
    this.#elWrap.append(this.#elCNE)

    this.#elCSE = document.createElement("div")
    this.#elCSE.classList.add(styles.gridCSE)
    this.#elWrap.append(this.#elCSE)
  }

  override initialize(): void {
    super.initialize()
    this.#scrollBarHorizontal.initialize()
    this.#scrollBarHorizontal.addEventListener("valueChanged", this.#render)
    this.#scrollBarVertical.initialize()
    this.#scrollBarVertical.addEventListener("valueChanged", this.#render)
  }

  arrange(size: ISize, previousSize?: ISize): void {
    if (
      size.height !== previousSize?.height ||
      size.width !== previousSize?.width
    ) {
      const scrollBarSizeHorizontal = parseInt(
        getComputedStyle(this.#elScrollBarVertical).getPropertyValue(
          "--codoodle-scrollBar-size"
        ) || "20",
        10
      )
      const scrollBarSizeVertical = parseInt(
        getComputedStyle(this.#elScrollBarVertical).getPropertyValue(
          "--codoodle-scrollBar-size"
        ) || "20",
        10
      )
      let scrollablePrev = {
        horizontal: this.#elWrap.classList.contains(
          styles.gridScrollableHorizontal
        ),
        vertical: this.#elWrap.classList.contains(
          styles.gridScrollableVertical
        ),
      }
      const sizeInnerPrev = {
        width: scrollablePrev.vertical
          ? size.width - scrollBarSizeVertical
          : size.width,
        height: scrollablePrev.horizontal
          ? size.height - scrollBarSizeHorizontal
          : size.height,
      }
      let scrollable = {
        horizontal: scrollablePrev.horizontal,
        vertical: scrollablePrev.vertical,
      }
      let sizeInner = {
        width: sizeInnerPrev.width,
        height: sizeInnerPrev.height,
      }
      do {
        this.#columns.forEach((c, i, columns) => {
          c.width = c.origin.width
          c.left = columns[i - 1]?.right ?? 0
          c.right = c.left + c.width
        })
        this.#columnsWidth = this.#columns[this.#columns.length - 1]?.right ?? 0

        // this.#rows.forEach((r, i, rows) => {
        //   r.height = r.origin.height
        //   r.top = rows[i - 1]?.bottom ?? 0
        //   r.bottom = r.top + r.height
        // })
        // this.#rowsHeight = this.#rows[this.#rows.length - 1]?.bottom ?? 0

        scrollablePrev = scrollable
        scrollable = {
          horizontal: this.#columnsWidth > sizeInner.width,
          vertical: this.#rowsHeight > sizeInner.height,
        }
        sizeInner = {
          width: scrollable.vertical
            ? size.width - scrollBarSizeVertical
            : size.width,
          height: scrollable.horizontal
            ? size.height - scrollBarSizeHorizontal
            : size.height,
        }
      } while (
        scrollablePrev.horizontal !== scrollable.horizontal ||
        scrollablePrev.vertical !== scrollable.vertical
      )

      if (scrollable.horizontal) {
        this.#scrollBarHorizontal.maximum = this.#columnsWidth - sizeInner.width
        this.#scrollBarHorizontal.measure({
          width: sizeInner.width,
          height: scrollBarSizeHorizontal,
        })
        this.#elWrap.classList.add(styles.gridScrollableHorizontal)
      } else {
        this.#scrollBarHorizontal.maximum = 0
        this.#scrollBarHorizontal.measure({
          width: sizeInner.width,
          height: scrollBarSizeHorizontal,
        })
        this.#elWrap.classList.remove(styles.gridScrollableHorizontal)
      }
      if (scrollable.vertical) {
        this.#scrollBarVertical.maximum = this.#rowsHeight - sizeInner.height
        this.#scrollBarVertical.measure({
          width: scrollBarSizeVertical,
          height: sizeInner.height - this.#headersHeight,
        })
        this.#elWrap.classList.add(styles.gridScrollableVertical)
      } else {
        this.#scrollBarVertical.maximum = 0
        this.#scrollBarVertical.measure({
          width: scrollBarSizeVertical,
          height: sizeInner.height - this.#headersHeight,
        })
        this.#elWrap.classList.remove(styles.gridScrollableVertical)
      }
    }
    this.#render()
  }

  #handleRender() {
    const bounds = {
      left: this.#scrollBarHorizontal.value,
      top: this.#scrollBarVertical.value,
      width: this.availableSize.width,
      height: this.availableSize.height,
    }
    const gridBounds = this.#getIndexBounds(bounds)
    this.#renderHead(gridBounds)
    this.#renderBody(gridBounds)
  }

  #renderHead(renderingBounds: GridRenderingBounds) {
    const columns = this.#columns.slice(
      renderingBounds.columnBegin,
      renderingBounds.columnEnd + 1
    )
    this.#elHead.innerHTML = columns
      .map(
        (c, columnIndex) =>
          `<div class="${styles.gridCell}" style="left: ${
            c.left - this.#scrollBarHorizontal.value
          }px; width: ${c.width}px; top: 0">head ${
            columnIndex + renderingBounds.columnBegin + 1
          }</div>`
      )
      .join(" ")
  }

  #renderBody(renderingBounds: GridRenderingBounds) {
    const columns = this.#columns.slice(
      renderingBounds.columnBegin,
      renderingBounds.columnEnd + 1
    )
    const rows = this.#rows.slice(
      renderingBounds.rowBegin,
      renderingBounds.rowEnd + 1
    )
    this.#elBody.innerHTML = rows
      .map((r, rowIndex) =>
        columns
          .map(
            (c, columnIndex) =>
              `<div class="${styles.gridCell}" style="left: ${
                c.left - this.#scrollBarHorizontal.value
              }px; width: ${c.width}px; top: ${
                r.top - this.#scrollBarVertical.value
              }px"><div class="${styles.gridCellContent}">Body ${
                rowIndex + renderingBounds.rowBegin + 1
              }-${columnIndex + renderingBounds.columnBegin + 1}</div></div>`
          )
          .join(" ")
      )
      .join(" ")
  }

  #getIndexBounds({ left, top, width, height }: IRect): GridRenderingBounds {
    const right = left + width
    const bottom = top + height
    const isPoint = width === 0 && height === 0
    const avgWidth = this.#columnsWidth / this.#columns.length
    const avgHeight = this.#rowsHeight / this.#rows.length
    let rowIndex = Math.min(
      this.#rows.length - 1,
      Math.max(0, Math.floor(top / avgHeight))
    )
    let rowBegin = this.#rows.length - 1
    let rowEnd = 0
    let row = this.#rows[rowIndex]
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    if (row!.top < bottom || (isPoint && row!.top <= bottom)) {
      do {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        if (row!.top < bottom || (isPoint && row!.top <= bottom)) {
          rowEnd = rowIndex
          row = this.#rows[++rowIndex]
          continue
        }
        break
      } while (row)
      row = this.#rows[rowEnd]
      do {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        if (top < row!.bottom) {
          rowBegin = rowIndex
          row = this.#rows[--rowIndex]
          continue
        }
        break
      } while (row)
    } else {
      do {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        if (top < row!.bottom) {
          rowBegin = rowIndex
          row = this.#rows[--rowIndex]
          continue
        }
        break
      } while (row)
      row = this.#rows[rowBegin]
      do {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        if (row!.top < bottom || (isPoint && row!.top <= bottom)) {
          rowEnd = rowIndex
          row = this.#rows[++rowIndex]
          continue
        }
        break
      } while (row)
    }
    let columnIndex = Math.min(
      this.#columns.length - 1,
      Math.max(0, Math.floor(left / avgWidth))
    )
    let columnBegin = this.#columns.length - 1
    let columnEnd = 0
    let column = this.#columns[columnIndex]
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    if (column!.left < right || (isPoint && column!.left <= right)) {
      do {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        if (column!.left < right || (isPoint && column!.left <= right)) {
          columnEnd = columnIndex
          column = this.#columns[++columnIndex]
          continue
        }
        break
      } while (column)
      column = this.#columns[columnEnd]
      do {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        if (left < column!.right) {
          columnBegin = columnIndex
          column = this.#columns[--columnIndex]
          continue
        }
        break
      } while (column)
    } else {
      do {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        if (left < column!.right) {
          columnBegin = columnIndex
          column = this.#columns[--columnIndex]
          continue
        }
        break
      } while (column)
      column = this.#columns[columnBegin]
      do {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        if (column!.left < right || (isPoint && column!.left <= right)) {
          columnEnd = columnIndex
          column = this.#columns[++columnIndex]
          continue
        }
        break
      } while (column)
    }
    return { rowBegin, rowEnd, columnBegin, columnEnd }
  }
}

export default Grid
