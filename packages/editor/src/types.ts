export interface LxElement {
  id: string
  tagName: string
  attrs: Record<string, string>
  children: LxElement[]
  text?: string
}

export interface ParsedNode {
  id: string
  el: HTMLElement | null
  left: PositionExpr | null
  right: PositionExpr | null
  top: PositionExpr | null
  bottom: PositionExpr | null
  width: SizeExpr | null
  height: SizeExpr | null
  aspect: AspectExpr | null
}

export interface PositionExpr {
  type: 'body-ref' | 'element-ref'
  edge: Edge
  offset: number
  raw: string
  targetId?: string
}

export interface SizeExpr {
  type: 'fixed' | 'range'
  value?: number
  min?: number
  max?: number
  raw: string
}

export interface AspectExpr {
  type: 'aspect'
  width: number
  height: number
  ratio: number
  raw: string
}

export type Edge = 'left' | 'right' | 'top' | 'bottom'

export interface PositionPickerState {
  isOpen: boolean
  elementId: string
  positionAttr: string
  targetX: number
  targetY: number
}

export interface EditorState {
  html: string
  parsedNodes: ParsedNode[]
  selectedElementId: string | null
  pickerState: PositionPickerState
}
