import "@codoodle/styles/dist/grid/grid.css"
import styles from "@codoodle/styles/dist/grid"
import type Rect from "../../Rect"
import type Size from "../../Size"
import toOptimizedFunction from "../../toOptimizedFunction"
import Control, { Initialization } from "../Control"
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
  #columns: InternalGridColumn[] = []
  #columnsOrigin: GridColumn[] = []
  #columnsWidth = 0
  #columnsFrozen = 0
  #rows: InternalGridRow<T>[] = []
  #rowsOrigin: T[] = []
  #rowsHeight = 0
  #rowsFrozen = 0
  #headersHeight = 30

  get #scrollableHorizontal() {
    return this.#elWrap.classList.contains(styles.gridScrollableHorizontal)
  }

  get #scrollableVertical() {
    return this.#elWrap.classList.contains(styles.gridScrollableVertical)
  }

  #handleRender = toOptimizedFunction(this, this.#render)

  #handleWheel: (e: WheelEvent) => void = function (this: Grid, e: WheelEvent) {
    let shouldBeRender = false
    if (this.#scrollableHorizontal && e.deltaX !== 0) {
      if (
        (this.#scrollBarHorizontal.value > this.#scrollBarHorizontal.minimum &&
          e.deltaX < 0) ||
        (this.#scrollBarHorizontal.value < this.#scrollBarHorizontal.maximum &&
          e.deltaX > 0)
      ) {
        e.preventDefault()
      }

      if (
        this.#scrollBarHorizontal.value > this.#scrollBarHorizontal.minimum ||
        this.#scrollBarHorizontal.value < this.#scrollBarHorizontal.maximum
      ) {
        this.#scrollBarHorizontal.value +=
          e.deltaX * this.#scrollBarHorizontal.ratio
        shouldBeRender = true
      }
    }
    if (this.#scrollableVertical && e.deltaY !== 0) {
      if (
        (this.#scrollBarVertical.value > this.#scrollBarVertical.minimum &&
          e.deltaY < 0) ||
        (this.#scrollBarVertical.value < this.#scrollBarVertical.maximum &&
          e.deltaY > 0)
      ) {
        e.preventDefault()
      }

      if (
        this.#scrollBarVertical.value > this.#scrollBarVertical.minimum ||
        this.#scrollBarVertical.value < this.#scrollBarVertical.maximum
      ) {
        this.#scrollBarVertical.value +=
          e.deltaY * this.#scrollBarVertical.ratio
        shouldBeRender = true
      }
    }
    if (shouldBeRender) {
      this.#handleRender()
    }
  }.bind(this)

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
    if (this.#columnsFrozen > 0 && this.#columns[this.#columnsFrozen - 1]) {
      this.#elWrap.classList.add(styles.gridFreezableColumns)
      this.#elBodyFrozenColumns.style.width = `${
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        this.#columns[this.#columnsFrozen - 1]!.right
      }px`
    } else {
      this.#elWrap.classList.remove(styles.gridFreezableColumns)
      this.#elHeadFrozenColumns.innerHTML = ""
      this.#elBodyFrozenColumns.innerHTML = ""
    }
    if (this.initialized) {
      this.#handleRender()
    }
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
    if (this.#rowsFrozen > 0 && this.#rows[this.#rowsFrozen - 1]) {
      this.#elWrap.classList.add(styles.gridFreezableRows)
      this.#elBodyFrozenRows.style.height = `${
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        this.#rows[this.#rowsFrozen - 1]!.bottom
      }px`
    } else {
      this.#elWrap.classList.remove(styles.gridFreezableRows)
      this.#elBodyFrozenRows.innerHTML = ""
    }
    if (this.initialized) {
      this.#handleRender()
    }
  }

  get frozenColumns(): number {
    return this.#columnsFrozen
  }
  set frozenColumns(value: number) {
    this.#columnsFrozen = Math.max(value, 0)
    if (this.#columnsFrozen > 0 && this.#columns[this.#columnsFrozen - 1]) {
      this.#elWrap.classList.add(styles.gridFreezableColumns)
      this.#elBodyFrozenColumns.style.width = `${
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        this.#columns[this.#columnsFrozen - 1]!.right
      }px`
    } else {
      this.#elWrap.classList.remove(styles.gridFreezableColumns)
      this.#elHeadFrozenColumns.innerHTML = ""
      this.#elBodyFrozenColumns.innerHTML = ""
    }
    if (this.initialized) {
      this.#handleRender()
    }
  }

  get frozenRows(): number {
    return this.#rowsFrozen
  }
  set frozenRows(value: number) {
    this.#rowsFrozen = value
    if (this.#rowsFrozen > 0 && this.#rows[this.#rowsFrozen - 1]) {
      this.#elWrap.classList.add(styles.gridFreezableRows)
      this.#elBodyFrozenRows.style.height = `${
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        this.#rows[this.#rowsFrozen - 1]!.bottom
      }px`
    } else {
      this.#elWrap.classList.remove(styles.gridFreezableRows)
      this.#elBodyFrozenRows.innerHTML = ""
    }
    if (this.initialized) {
      this.#handleRender()
    }
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

  @Initialization
  override initialize(): void {
    super.initialize()
    this.#elWrap.addEventListener("wheel", this.#handleWheel)
    this.#scrollBarHorizontal.initialize()
    this.#scrollBarHorizontal.addEventListener(
      "valueChanged",
      this.#handleRender
    )
    this.#scrollBarVertical.initialize()
    this.#scrollBarVertical.addEventListener("valueChanged", this.#handleRender)
  }

  override dispose(): void {
    this.#elWrap.removeEventListener("wheel", this.#handleWheel)
    this.#scrollBarHorizontal.removeEventListener(
      "valueChanged",
      this.#handleRender
    )
    this.#scrollBarHorizontal.dispose()
    this.#scrollBarVertical.removeEventListener(
      "valueChanged",
      this.#handleRender
    )
    this.#scrollBarVertical.dispose()
    super.dispose()
  }

  arrange(size: Size, previousSize?: Size): void {
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
        horizontal: this.#scrollableHorizontal,
        vertical: this.#scrollableVertical,
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
            ? size.height - this.#headersHeight - scrollBarSizeHorizontal
            : size.height - this.#headersHeight,
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
          height: sizeInner.height,
        })
        this.#elWrap.classList.add(styles.gridScrollableVertical)
      } else {
        this.#scrollBarVertical.maximum = 0
        this.#scrollBarVertical.measure({
          width: scrollBarSizeVertical,
          height: sizeInner.height,
        })
        this.#elWrap.classList.remove(styles.gridScrollableVertical)
      }
    }
    this.#handleRender()
  }

  #render() {
    const bounds = {
      left: this.#scrollBarHorizontal.value,
      top: this.#scrollBarVertical.value,
      width: this.availableSize.width,
      height: this.availableSize.height,
    }
    const columnsFrozen =
      this.#columnsFrozen > 0 && this.#columns[this.#columnsFrozen - 1]
        ? this.#columnsFrozen
        : 0
    const rowsFrozen =
      this.#rowsFrozen > 0 && this.#rows[this.#rowsFrozen - 1]
        ? this.#rowsFrozen
        : 0
    if (columnsFrozen > 0) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const right = this.#columns[this.#columnsFrozen - 1]!.right
      bounds.left += right
      bounds.width -= right
    }
    if (rowsFrozen) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const bottom = this.#rows[this.#rowsFrozen - 1]!.bottom
      bounds.top += bottom
      bounds.height -= bottom
    }
    const gridBounds = this.#getIndexBounds(bounds)
    console.log(bounds, gridBounds)

    this.#renderHead(gridBounds)
    this.#renderBody(gridBounds)
  }

  #renderHead({
    columnBegin: renderingBoundsColumnBegin,
    columnEnd: renderingBoundsColumnEnd,
  }: GridRenderingBounds) {
    const columnsFrozen =
      this.#columnsFrozen > 0 && this.#columns[this.#columnsFrozen - 1]
        ? this.#columnsFrozen
        : 0
    const elCellBase = document.createElement("div")
    elCellBase.classList.add(styles.gridCell)
    {
      const renderingBounds = {
        rowBegin: 0,
        rowEnd: 0,
        columnBegin: Math.max(columnsFrozen, renderingBoundsColumnBegin),
        columnEnd: renderingBoundsColumnEnd,
      }
      const columns = this.#columns.slice(
        renderingBounds.columnBegin,
        renderingBounds.columnEnd + 1
      )
      const latestColumnIndex = this.#columns.length - 1
      const renderedColumns = new Set<number>()
      const renderedRows = new Set<number>()
      const removeCells: HTMLElement[] = []
      for (const child of this.#elHead.children) {
        const elCell = child as HTMLElement
        const columnBegin = parseInt(elCell.dataset["columnBegin"] ?? "-1", 10)
        const columnEnd = parseInt(elCell.dataset["columnEnd"] ?? "-1", 10)
        const column = this.#columns[columnBegin]
        const rowBegin = parseInt(elCell.dataset["rowBegin"] ?? "-1", 10)
        const rowEnd = parseInt(elCell.dataset["rowEnd"] ?? "-1", 10)
        const intersectsWith = !(
          renderingBounds.rowBegin > rowEnd ||
          renderingBounds.rowEnd < rowBegin ||
          renderingBounds.columnBegin > columnEnd ||
          renderingBounds.columnEnd < columnBegin
        )
        if (intersectsWith && column) {
          for (let i = columnBegin; i <= columnEnd; i++) {
            renderedColumns.add(i)
          }
          for (let i = rowBegin; i <= rowEnd; i++) {
            renderedRows.add(rowBegin)
          }
          elCell.style.left = `${
            column.left - this.#scrollBarHorizontal.value
          }px`
          elCell.style.top = "0"
          elCell.style.width = `${column.width}px`
          continue
        }
        removeCells.push(elCell)
      }
      for (const elCell of removeCells) {
        elCell.remove()
      }
      let columnIndex = renderingBounds.columnBegin
      for (const column of columns) {
        if (!renderedColumns.has(columnIndex)) {
          const elCell = elCellBase.cloneNode() as HTMLDivElement
          if (columnIndex === latestColumnIndex) {
            elCell.classList.add(styles.gridCellLastColumn)
          }
          elCell.style.left = `${
            column.left - this.#scrollBarHorizontal.value
          }px`
          elCell.style.top = "0"
          elCell.style.width = `${column.width}px`
          elCell.dataset["columnBegin"] = `${columnIndex}`
          elCell.dataset["columnEnd"] = `${columnIndex}`
          elCell.dataset["rowBegin"] = "0"
          elCell.dataset["rowEnd"] = "0"
          elCell.append(
            `${column.origin.name ?? column.origin.dataField ?? ""}`
          )
          this.#elHead.append(elCell)
        }
        columnIndex++
      }
    }
    if (columnsFrozen > 0) {
      const renderingBounds = {
        rowBegin: 0,
        rowEnd: 0,
        columnBegin: 0,
        columnEnd: columnsFrozen - 1,
      }
      const columns = this.#columns.slice(
        renderingBounds.columnBegin,
        renderingBounds.columnEnd + 1
      )
      const renderedColumns = new Set<number>()
      const renderedRows = new Set<number>()
      const removeCells: HTMLElement[] = []
      for (const child of this.#elHeadFrozenColumns.children) {
        const elCell = child as HTMLElement
        const columnBegin = parseInt(elCell.dataset["columnBegin"] ?? "-1", 10)
        const columnEnd = parseInt(elCell.dataset["columnEnd"] ?? "-1", 10)
        const column = this.#columns[columnBegin]
        const rowBegin = parseInt(elCell.dataset["rowBegin"] ?? "-1", 10)
        const rowEnd = parseInt(elCell.dataset["rowEnd"] ?? "-1", 10)
        const intersectsWith = !(
          renderingBounds.rowBegin > rowEnd ||
          renderingBounds.rowEnd < rowBegin ||
          renderingBounds.columnBegin > columnEnd ||
          renderingBounds.columnEnd < columnBegin
        )
        if (intersectsWith && column) {
          for (let i = columnBegin; i <= columnEnd; i++) {
            renderedColumns.add(i)
          }
          for (let i = rowBegin; i <= rowEnd; i++) {
            renderedRows.add(rowBegin)
          }
          elCell.style.left = `${column.left}px`
          elCell.style.top = "0"
          elCell.style.width = `${column.width}px`
          continue
        }
        removeCells.push(elCell)
      }
      for (const elCell of removeCells) {
        elCell.remove()
      }
      let columnIndex = renderingBounds.columnBegin
      for (const column of columns) {
        if (!renderedColumns.has(columnIndex)) {
          const elCell = elCellBase.cloneNode() as HTMLDivElement
          elCell.style.left = `${column.left}px`
          elCell.style.top = "0"
          elCell.style.width = `${column.width}px`
          elCell.dataset["columnBegin"] = `${columnIndex}`
          elCell.dataset["columnEnd"] = `${columnIndex}`
          elCell.dataset["rowBegin"] = "0"
          elCell.dataset["rowEnd"] = "0"
          elCell.append(
            `${column.origin.name ?? column.origin.dataField ?? ""}`
          )
          this.#elHeadFrozenColumns.append(elCell)
        }
        columnIndex++
      }
    }
  }

  #renderBody({
    rowBegin: renderingBoundsRowBegin,
    rowEnd: renderingBoundsRowEnd,
    columnBegin: renderingBoundsColumnBegin,
    columnEnd: renderingBoundsColumnEnd,
  }: GridRenderingBounds) {
    const columnsFrozen =
      this.#columnsFrozen > 0 && this.#columns[this.#columnsFrozen - 1]
        ? this.#columnsFrozen
        : 0
    const rowsFrozen =
      this.#rowsFrozen > 0 && this.#rows[this.#rowsFrozen - 1]
        ? this.#rowsFrozen
        : 0
    const elCellBase = document.createElement("div")
    elCellBase.classList.add(styles.gridCell)
    {
      const renderingBounds = {
        rowBegin: renderingBoundsRowBegin,
        rowEnd: renderingBoundsRowEnd,
        columnBegin: renderingBoundsColumnBegin,
        columnEnd: renderingBoundsColumnEnd,
      }
      const columns = this.#columns.slice(
        renderingBounds.columnBegin,
        renderingBounds.columnEnd + 1
      )
      const rows = this.#rows.slice(
        renderingBounds.rowBegin,
        renderingBounds.rowEnd + 1
      )
      const latestColumnIndex = this.#columns.length - 1
      const latestRowIndex = this.#rows.length - 1
      const renderedColumns = new Set<number>()
      const renderedRows = new Set<number>()
      const removeCells: HTMLElement[] = []
      for (const child of this.#elBody.children) {
        const elCell = child as HTMLElement
        const columnBegin = parseInt(elCell.dataset["columnBegin"] ?? "-1", 10)
        const columnEnd = parseInt(elCell.dataset["columnEnd"] ?? "-1", 10)
        const column = this.#columns[columnBegin]
        const rowBegin = parseInt(elCell.dataset["rowBegin"] ?? "-1", 10)
        const rowEnd = parseInt(elCell.dataset["rowEnd"] ?? "-1", 10)
        const row = this.#rows[rowBegin]
        const intersectsWith = !(
          renderingBounds.rowBegin > rowEnd ||
          renderingBounds.rowEnd < rowBegin ||
          renderingBounds.columnBegin > columnEnd ||
          renderingBounds.columnEnd < columnBegin
        )
        if (intersectsWith && column && row) {
          for (let i = columnBegin; i <= columnEnd; i++) {
            renderedColumns.add(i)
          }
          for (let i = rowBegin; i <= rowEnd; i++) {
            renderedRows.add(rowBegin)
          }
          elCell.style.left = `${
            column.left - this.#scrollBarHorizontal.value
          }px`
          elCell.style.top = `${row.top - this.#scrollBarVertical.value}px`
          elCell.style.width = `${column.width}px`
          continue
        }
        removeCells.push(elCell)
      }
      for (const elCell of removeCells) {
        elCell.remove()
      }
      let rowIndex = renderingBounds.rowBegin
      for (const row of rows) {
        let columnIndex = renderingBounds.columnBegin
        for (const column of columns) {
          if (
            !renderedRows.has(rowIndex) ||
            !renderedColumns.has(columnIndex)
          ) {
            const elCell = elCellBase.cloneNode() as HTMLDivElement
            if (columnIndex === latestColumnIndex) {
              elCell.classList.add(styles.gridCellLastColumn)
            }
            if (rowIndex === latestRowIndex) {
              elCell.classList.add(styles.gridCellLastRow)
            }
            elCell.style.left = `${
              column.left - this.#scrollBarHorizontal.value
            }px`
            elCell.style.top = `${row.top - this.#scrollBarVertical.value}px`
            elCell.style.width = `${column.width}px`
            elCell.dataset["columnBegin"] = `${columnIndex}`
            elCell.dataset["columnEnd"] = `${columnIndex}`
            elCell.dataset["rowBegin"] = `${rowIndex}`
            elCell.dataset["rowEnd"] = `${rowIndex}`
            elCell.append(
              `${
                column.origin.dataField && row.origin[column.origin.dataField]
              }`
            )
            this.#elBody.append(elCell)
          }
          columnIndex++
        }
        rowIndex++
      }
    }
    if (columnsFrozen > 0) {
      const renderingBounds = {
        rowBegin: renderingBoundsRowBegin,
        rowEnd: renderingBoundsRowEnd,
        columnBegin: 0,
        columnEnd: columnsFrozen - 1,
      }
      const columns = this.#columns.slice(
        renderingBounds.columnBegin,
        renderingBounds.columnEnd + 1
      )
      const rows = this.#rows.slice(
        renderingBounds.rowBegin,
        renderingBounds.rowEnd + 1
      )
      const latestRowIndex = this.#rows.length - 1
      const renderedColumns = new Set<number>()
      const renderedRows = new Set<number>()
      const removeCells: HTMLElement[] = []
      for (const child of this.#elBodyFrozenColumns.children) {
        const elCell = child as HTMLElement
        const columnBegin = parseInt(elCell.dataset["columnBegin"] ?? "-1", 10)
        const columnEnd = parseInt(elCell.dataset["columnEnd"] ?? "-1", 10)
        const column = this.#columns[columnBegin]
        const rowBegin = parseInt(elCell.dataset["rowBegin"] ?? "-1", 10)
        const rowEnd = parseInt(elCell.dataset["rowEnd"] ?? "-1", 10)
        const row = this.#rows[rowBegin]
        const intersectsWith = !(
          renderingBounds.rowBegin > rowEnd ||
          renderingBounds.rowEnd < rowBegin ||
          renderingBounds.columnBegin > columnEnd ||
          renderingBounds.columnEnd < columnBegin
        )
        if (intersectsWith && column && row) {
          for (let i = columnBegin; i <= columnEnd; i++) {
            renderedColumns.add(i)
          }
          for (let i = rowBegin; i <= rowEnd; i++) {
            renderedRows.add(rowBegin)
          }
          elCell.style.left = `${column.left}px`
          elCell.style.top = `${row.top - this.#scrollBarVertical.value}px`
          elCell.style.width = `${column.width}px`
          continue
        }
        removeCells.push(elCell)
      }
      for (const elCell of removeCells) {
        elCell.remove()
      }
      let rowIndex = renderingBounds.rowBegin
      for (const row of rows) {
        let columnIndex = renderingBounds.columnBegin
        for (const column of columns) {
          if (
            !renderedRows.has(rowIndex) ||
            !renderedColumns.has(columnIndex)
          ) {
            const elCell = elCellBase.cloneNode() as HTMLDivElement
            if (rowIndex === latestRowIndex) {
              elCell.classList.add(styles.gridCellLastRow)
            }
            elCell.style.left = `${column.left}px`
            elCell.style.top = `${row.top - this.#scrollBarVertical.value}px`
            elCell.style.width = `${column.width}px`
            elCell.dataset["columnBegin"] = `${columnIndex}`
            elCell.dataset["columnEnd"] = `${columnIndex}`
            elCell.dataset["rowBegin"] = `${rowIndex}`
            elCell.dataset["rowEnd"] = `${rowIndex}`
            elCell.append(
              `${
                column.origin.dataField && row.origin[column.origin.dataField]
              }`
            )
            this.#elBodyFrozenColumns.append(elCell)
          }
          columnIndex++
        }
        rowIndex++
      }
    }

    if (rowsFrozen > 0) {
      const renderingBounds = {
        rowBegin: 0,
        rowEnd: rowsFrozen - 1,
        columnBegin: renderingBoundsColumnBegin,
        columnEnd: renderingBoundsColumnEnd,
      }
      const columns = this.#columns.slice(
        renderingBounds.columnBegin,
        renderingBounds.columnEnd + 1
      )
      const rows = this.#rows.slice(
        renderingBounds.rowBegin,
        renderingBounds.rowEnd + 1
      )
      const latestColumnIndex = this.#columns.length - 1
      const renderedColumns = new Set<number>()
      const renderedRows = new Set<number>()
      const removeCells: HTMLElement[] = []
      for (const child of this.#elBodyFrozenRows.children) {
        const elCell = child as HTMLElement
        const columnBegin = parseInt(elCell.dataset["columnBegin"] ?? "-1", 10)
        const columnEnd = parseInt(elCell.dataset["columnEnd"] ?? "-1", 10)
        const column = this.#columns[columnBegin]
        const rowBegin = parseInt(elCell.dataset["rowBegin"] ?? "-1", 10)
        const rowEnd = parseInt(elCell.dataset["rowEnd"] ?? "-1", 10)
        const row = this.#rows[rowBegin]
        const intersectsWith = !(
          renderingBounds.rowBegin > rowEnd ||
          renderingBounds.rowEnd < rowBegin ||
          renderingBounds.columnBegin > columnEnd ||
          renderingBounds.columnEnd < columnBegin
        )
        if (intersectsWith && column && row) {
          for (let i = columnBegin; i <= columnEnd; i++) {
            renderedColumns.add(i)
          }
          for (let i = rowBegin; i <= rowEnd; i++) {
            renderedRows.add(rowBegin)
          }
          elCell.style.left = `${
            column.left - this.#scrollBarHorizontal.value
          }px`
          elCell.style.top = `${row.top}px`
          elCell.style.width = `${column.width}px`
          continue
        }
        removeCells.push(elCell)
      }
      for (const elCell of removeCells) {
        elCell.remove()
      }
      let rowIndex = renderingBounds.rowBegin
      for (const row of rows) {
        let columnIndex = renderingBounds.columnBegin
        for (const column of columns) {
          if (
            !renderedRows.has(rowIndex) ||
            !renderedColumns.has(columnIndex)
          ) {
            const elCell = elCellBase.cloneNode() as HTMLDivElement
            if (columnIndex === latestColumnIndex) {
              elCell.classList.add(styles.gridCellLastColumn)
            }
            elCell.style.left = `${
              column.left - this.#scrollBarHorizontal.value
            }px`
            elCell.style.top = `${row.top}px`
            elCell.style.width = `${column.width}px`
            elCell.dataset["columnBegin"] = `${columnIndex}`
            elCell.dataset["columnEnd"] = `${columnIndex}`
            elCell.dataset["rowBegin"] = `${rowIndex}`
            elCell.dataset["rowEnd"] = `${rowIndex}`
            elCell.append(
              `${
                column.origin.dataField && row.origin[column.origin.dataField]
              }`
            )
            this.#elBodyFrozenRows.append(elCell)
          }
          columnIndex++
        }
        rowIndex++
      }
    }

    if (columnsFrozen > 0 && rowsFrozen > 0) {
      const renderingBounds = {
        rowBegin: 0,
        rowEnd: rowsFrozen - 1,
        columnBegin: 0,
        columnEnd: columnsFrozen - 1,
      }
      const columns = this.#columns.slice(
        renderingBounds.columnBegin,
        renderingBounds.columnEnd + 1
      )
      const rows = this.#rows.slice(
        renderingBounds.rowBegin,
        renderingBounds.rowEnd + 1
      )
      const renderedColumns = new Set<number>()
      const renderedRows = new Set<number>()
      const removeCells: HTMLElement[] = []
      for (const child of this.#elBodyFrozenColumnsAndRows.children) {
        const elCell = child as HTMLElement
        const columnBegin = parseInt(elCell.dataset["columnBegin"] ?? "-1", 10)
        const columnEnd = parseInt(elCell.dataset["columnEnd"] ?? "-1", 10)
        const column = this.#columns[columnBegin]
        const rowBegin = parseInt(elCell.dataset["rowBegin"] ?? "-1", 10)
        const rowEnd = parseInt(elCell.dataset["rowEnd"] ?? "-1", 10)
        const row = this.#rows[rowBegin]
        const intersectsWith = !(
          renderingBounds.rowBegin > rowEnd ||
          renderingBounds.rowEnd < rowBegin ||
          renderingBounds.columnBegin > columnEnd ||
          renderingBounds.columnEnd < columnBegin
        )
        if (intersectsWith && column && row) {
          for (let i = columnBegin; i <= columnEnd; i++) {
            renderedColumns.add(i)
          }
          for (let i = rowBegin; i <= rowEnd; i++) {
            renderedRows.add(rowBegin)
          }
          elCell.style.left = `${column.left}px`
          elCell.style.top = `${row.top}px`
          elCell.style.width = `${column.width}px`
          continue
        }
        removeCells.push(elCell)
      }
      for (const elCell of removeCells) {
        elCell.remove()
      }
      let rowIndex = renderingBounds.rowBegin
      for (const row of rows) {
        let columnIndex = renderingBounds.columnBegin
        for (const column of columns) {
          if (
            !renderedRows.has(rowIndex) ||
            !renderedColumns.has(columnIndex)
          ) {
            const elCell = elCellBase.cloneNode() as HTMLDivElement
            elCell.style.left = `${column.left}px`
            elCell.style.top = `${row.top}px`
            elCell.style.width = `${column.width}px`
            elCell.dataset["columnBegin"] = `${columnIndex}`
            elCell.dataset["columnEnd"] = `${columnIndex}`
            elCell.dataset["rowBegin"] = `${rowIndex}`
            elCell.dataset["rowEnd"] = `${rowIndex}`
            elCell.append(
              `${
                column.origin.dataField && row.origin[column.origin.dataField]
              }`
            )
            this.#elBodyFrozenColumnsAndRows.append(elCell)
          }
          columnIndex++
        }
        rowIndex++
      }
    }
  }

  #getIndexBounds({ left, top, width, height }: Rect): GridRenderingBounds {
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
