import type GridColumnAlignment from "./GridColumnAlignment"

interface GridColumn {
  name?: string
  dataField?: string
  align?: GridColumnAlignment
  width: number
}

export default GridColumn
