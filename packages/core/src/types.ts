export interface InitOptions {
	debug?: boolean
}

export type Edge = 'left' | 'right' | 'top' | 'bottom'

export type PositionAttrName = 'lx-left' | 'lx-right' | 'lx-top' | 'lx-bottom'

export type SizeAttrName = 'lx-width' | 'lx-height'

export interface BodyPositionExpr {
	type: 'body-ref'
	edge: Edge
	offset: number
	raw: string
}

export interface ElementPositionExpr {
	type: 'element-ref'
	targetId: string
	edge: Edge
	offset: number
	raw: string
}

export type PositionExpr = BodyPositionExpr | ElementPositionExpr

export interface FixedSizeExpr {
	type: 'fixed'
	value: number
	raw: string
}

export interface RangeSizeExpr {
	type: 'range'
	min: number
	max: number
	raw: string
}

export type SizeExpr = FixedSizeExpr | RangeSizeExpr

export interface AspectExpr {
	type: 'aspect'
	width: number
	height: number
	ratio: number
	raw: string
}

export interface ResolvedBox {
	left: number
	right: number
	top: number
	bottom: number
	width: number
	height: number
}

export interface CanonicalAttr {
	value: string
	originalAttr: string
}

export interface CanonicalAttrMap {
	left?: CanonicalAttr
	right?: CanonicalAttr
	top?: CanonicalAttr
	bottom?: CanonicalAttr
	width?: CanonicalAttr
	height?: CanonicalAttr
	aspect?: CanonicalAttr
}

export interface CanonicalNode {
	id: string
	el: HTMLElement
	left: PositionExpr | null
	right: PositionExpr | null
	top: PositionExpr | null
	bottom: PositionExpr | null
	width: SizeExpr | null
	height: SizeExpr | null
	aspect: AspectExpr | null
	refs: Set<string>
	resolved: ResolvedBox | null
	canonicalAttrs: CanonicalAttrMap
}

export const POSITION_ATTRS = ['lx-left', 'lx-right', 'lx-top', 'lx-bottom'] as const

export const SIZE_ATTRS = ['lx-width', 'lx-height'] as const

export const ASPECT_ATTR = 'lx-aspect' as const

export const ALL_ATTRS: string[] = [...POSITION_ATTRS, ...SIZE_ATTRS, ASPECT_ATTR]

export const ATTR_ALIASES: Readonly<Record<string, string>> = Object.freeze({
	'lx-l': 'lx-left',
	'lx-r': 'lx-right',
	'lx-t': 'lx-top',
	'lx-b': 'lx-bottom',
	'lx-w': 'lx-width',
	'lx-h': 'lx-height',
	'lx-a': 'lx-aspect',
})

export const POSITION_RE = /^(body|#([A-Za-z_][\w\-:.]*))\.(left|right|top|bottom)([+-]\d+(?:\.\d+)?)?$/

export const RELATIVE_POSITION_RE = /^(previous|next)\.(left|right|top|bottom)([+-]\d+(?:\.\d+)?)?$/

export const FIXED_SIZE_RE = /^-?\d+(?:\.\d+)?$/

export const RANGE_SIZE_RE = /^(-?\d+(?:\.\d+)?)\/(-?\d+(?:\.\d+)?)$/

export const ASPECT_RE = /^(\d+(?:\.\d+)?):(\d+(?:\.\d+)?)$/

export const EXPRESSION_RE = /^\(([^()]+)\)$/

export const POSITION_EXPR_RE = /^(body|#([A-Za-z_][\w\-:.]*))\.(left|right|top|bottom)([+-])(\(.+\))$/

export const VARIABLE_RE = /^\{([A-Za-z_][\w]*)\}$/

export const MATH_TOKEN_RE = /(-?\d+(?:\.\d+)?|\{[^}]+\}|[+\-*/])/
