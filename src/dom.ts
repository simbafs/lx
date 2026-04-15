import { CanonicalNode, ResolvedBox } from './types'

export function describeEl(el: HTMLElement): string {
	const id = el.id ? ` id="${el.id}"` : ''
	return `<${el.tagName.toLowerCase()}${id}>`
}

export function px(value: number): string {
	return `${value}px`
}

export function getBodyBox(): ResolvedBox {
	const width = document.documentElement.clientWidth
	const height = document.documentElement.clientHeight

	return {
		left: 0,
		top: 0,
		right: width,
		bottom: height,
		width,
		height,
	}
}

export function readElementBox(el: HTMLElement): ResolvedBox {
	const rect = el.getBoundingClientRect()
	return {
		left: rect.left,
		right: rect.right,
		top: rect.top,
		bottom: rect.bottom,
		width: rect.width,
		height: rect.height,
	}
}

export function ensurePositionable(el: HTMLElement): void {
	const style = window.getComputedStyle(el)

	if (style.position === 'static') {
		el.style.position = 'absolute'
	}

	el.style.boxSizing = 'border-box'
}

export function applyBaseSizeCSS(node: CanonicalNode): void {
	const { el, width, height } = node

	ensurePositionable(el)

	if (width) {
		if (width.type === 'fixed') {
			el.style.width = px(width.value)
		} else {
			el.style.width = 'auto'
			el.style.minWidth = px(width.min)
			el.style.maxWidth = px(width.max)
		}
	}

	if (height) {
		if (height.type === 'fixed') {
			el.style.height = px(height.value)
		} else {
			el.style.height = 'auto'
			el.style.minHeight = px(height.min)
			el.style.maxHeight = px(height.max)
		}
	}
}

export function applyResolvedBox(node: CanonicalNode, box: ResolvedBox, nodes: Map<string, CanonicalNode>): void {
	ensurePositionable(node.el)

	const container = findContainingBlock(node, nodes)

	const baseLeft = container && container.resolved ? container.resolved.left : 0
	const baseTop = container && container.resolved ? container.resolved.top : 0

	const cssLeft = box.left - baseLeft
	const cssTop = box.top - baseTop

	node.el.style.left = px(cssLeft)
	node.el.style.top = px(cssTop)
	node.el.style.width = px(box.width)
	node.el.style.height = px(box.height)
	node.el.style.right = ''
	node.el.style.bottom = ''
}

export function findContainingBlock(node: CanonicalNode, nodes: Map<string, CanonicalNode>): CanonicalNode | null {
	let current: HTMLElement | null = node.el.parentElement

	while (current && current !== document.body) {
		if (current.id && nodes.has(current.id)) {
			const found = nodes.get(current.id)
			return found ?? null
		}
		current = current.parentElement
	}

	return null
}

export function formatPositionExpr(expr: { type: string; edge: string; offset: number; targetId?: string } | null): string {
	if (!expr) return ''

	if (expr.type === 'body-ref') {
		return `body.${expr.edge}${expr.offset >= 0 ? '+' : ''}${expr.offset}`
	}

	return `#${expr.targetId}.${expr.edge}${expr.offset >= 0 ? '+' : ''}${expr.offset}`
}

export function formatSizeExpr(expr: { type: string; value?: number; min?: number; max?: number } | null): string {
	if (!expr) return ''

	if (expr.type === 'fixed') {
		return String(expr.value)
	}

	return `${expr.min}/${expr.max}`
}

export interface CanonicalRowData {
	id: string
	left: string
	right: string
	top: string
	bottom: string
	width: string
	height: string
	refs: string
}

export function canonicalRow(node: CanonicalNode): CanonicalRowData {
	return {
		id: `#${node.id}`,
		left: formatPositionExpr(node.left),
		right: formatPositionExpr(node.right),
		top: formatPositionExpr(node.top),
		bottom: formatPositionExpr(node.bottom),
		width: formatSizeExpr(node.width),
		height: formatSizeExpr(node.height),
		refs: Array.from(node.refs)
			.map((id) => `#${id}`)
			.join(', '),
	}
}

export interface ResolvedRowData {
	id: string
	left: number | string
	top: number | string
	right: number | string
	bottom: number | string
	width: number | string
	height: number | string
}

export function resolvedRow(node: CanonicalNode): ResolvedRowData {
	return {
		id: `#${node.id}`,
		left: node.resolved ? node.resolved.left : '',
		top: node.resolved ? node.resolved.top : '',
		right: node.resolved ? node.resolved.right : '',
		bottom: node.resolved ? node.resolved.bottom : '',
		width: node.resolved ? node.resolved.width : '',
		height: node.resolved ? node.resolved.height : '',
	}
}

export interface CanonicalAttrsRowData {
	id: string
	left: string
	right: string
	top: string
	bottom: string
	width: string
	height: string
}

export function canonicalAttrsRow(node: CanonicalNode): CanonicalAttrsRowData {
	return {
		id: `#${node.id}`,
		left: node.canonicalAttrs.left?.value ?? '',
		right: node.canonicalAttrs.right?.value ?? '',
		top: node.canonicalAttrs.top?.value ?? '',
		bottom: node.canonicalAttrs.bottom?.value ?? '',
		width: node.canonicalAttrs.width?.value ?? '',
		height: node.canonicalAttrs.height?.value ?? '',
	}
}

export interface AppliedCssRowData {
	id: string
	cssLeft: string
	cssTop: string
	cssWidth: string
	cssHeight: string
}

export function appliedCssRow(node: CanonicalNode): AppliedCssRowData {
	return {
		id: `#${node.id}`,
		cssLeft: node.el.style.left || '',
		cssTop: node.el.style.top || '',
		cssWidth: node.el.style.width || '',
		cssHeight: node.el.style.height || '',
	}
}

export function printParsedNodes(nodes: Map<string, CanonicalNode>): void {
	const rows: CanonicalRowData[] = []

	for (const [, node] of nodes) {
		rows.push(canonicalRow(node))
	}

	console.log('%c[lx] Parsed canonical nodes', 'color:#3498db;font-weight:bold;')
	console.table(rows)
}

export function printCanonicalNodes(nodes: Map<string, CanonicalNode>): void {
	const rows: CanonicalAttrsRowData[] = []

	for (const [, node] of nodes) {
		rows.push(canonicalAttrsRow(node))
	}

	console.log('%c[lx] Canonical called', 'color:#e74c3c;font-weight:bold;')
	console.table(rows)
}

export function printDependencyOrder(ordered: CanonicalNode[]): void {
	console.log('%c[lx] Dependency order', 'color:#9b59b6;font-weight:bold;')
	console.log(ordered.map((node) => `#${node.id}`).join(' -> '))
}

export function printResolvedNodes(nodes: Map<string, CanonicalNode>): void {
	const rows: ResolvedRowData[] = []

	for (const [, node] of nodes) {
		rows.push(resolvedRow(node))
	}

	console.log('%c[lx] Resolved boxes', 'color:#27ae60;font-weight:bold;')
	console.table(rows)
}

export function printAppliedCss(nodes: Map<string, CanonicalNode>): void {
	const rows: AppliedCssRowData[] = []

	for (const [, node] of nodes) {
		rows.push(appliedCssRow(node))
	}

	console.log('%c[lx] Applied CSS', 'color:#e67e22;font-weight:bold;')
	console.table(rows)
}
