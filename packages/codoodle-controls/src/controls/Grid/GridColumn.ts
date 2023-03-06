import type GridColumnAlignment from "./GridColumnAlignment"

interface GridColumn {
  dataField?: string | undefined
  align?: GridColumnAlignment | undefined
  width: number
}

export default GridColumn
