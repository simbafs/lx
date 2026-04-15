import {
	CanonicalNode,
	Edge,
	PositionExpr,
	ResolvedBox,
} from './types'
import { describeEl, getBodyBox } from './dom'

export function resolvePositionExpr(expr: PositionExpr, nodes: Map<string, CanonicalNode>): number {
	if (expr.type === 'body-ref') {
		const bodyBox = getBodyBox()
		return bodyBox[expr.edge] + expr.offset
	}

	const targetNode = nodes.get(expr.targetId)
	if (!targetNode || !targetNode.resolved) {
		throw new Error(`[lx] Cannot resolve reference "#${expr.targetId}".`)
	}

	return targetNode.resolved[expr.edge] + expr.offset
}

export function resolveNode(node: CanonicalNode, nodes: Map<string, CanonicalNode>): ResolvedBox {
	let left: number | undefined
	let right: number | undefined
	let top: number | undefined
	let bottom: number | undefined
	let width: number | undefined
	let height: number | undefined

	if (node.left) {
		left = resolvePositionExpr(node.left, nodes)
	}
	if (node.right) {
		right = resolvePositionExpr(node.right, nodes)
	}
	if (node.top) {
		top = resolvePositionExpr(node.top, nodes)
	}
	if (node.bottom) {
		bottom = resolvePositionExpr(node.bottom, nodes)
	}

	if (node.width?.type === 'fixed') {
		width = node.width.value
	}
	if (node.height?.type === 'fixed') {
		height = node.height.value
	}

	if (node.width?.type === 'range' || node.height?.type === 'range') {
		clearInsetCSS(node)

		if (left !== undefined) node.el.style.left = px(left)
		if (right !== undefined) node.el.style.right = px(right)
		if (top !== undefined) node.el.style.top = px(top)
		if (bottom !== undefined) node.el.style.bottom = px(bottom)

		const measured = readElementBox(node.el)

		if (node.width?.type === 'range') {
			width = clamp(measured.width, node.width.min, node.width.max)
			node.el.style.width = px(width)
		}

		if (node.height?.type === 'range') {
			height = clamp(measured.height, node.height.min, node.height.max)
			node.el.style.height = px(height)
		}
	}

	if (left !== undefined && right !== undefined) {
		width = right - left
	} else if (left !== undefined && width !== undefined) {
		right = left + width
	} else if (right !== undefined && width !== undefined) {
		left = right - width
	}

	if (top !== undefined && bottom !== undefined) {
		height = bottom - top
	} else if (top !== undefined && height !== undefined) {
		bottom = top + height
	} else if (bottom !== undefined && height !== undefined) {
		top = bottom - height
	}

	if (
		left === undefined ||
		right === undefined ||
		top === undefined ||
		bottom === undefined ||
		width === undefined ||
		height === undefined
	) {
		throw new Error(`[lx] Failed to resolve ${describeEl(node.el)}.`)
	}

	const box: ResolvedBox = {
		left,
		right,
		top,
		bottom,
		width,
		height,
	}

	return box
}

function px(value: number): string {
	return `${value}px`
}

function clamp(value: number, min: number, max: number): number {
	return Math.max(min, Math.min(max, value))
}

function clearInsetCSS(node: CanonicalNode): void {
	node.el.style.left = ''
	node.el.style.right = ''
	node.el.style.top = ''
	node.el.style.bottom = ''
}

function readElementBox(el: HTMLElement): ResolvedBox {
	const rect = el.getBoundingClientRect()
	return cloneRect(rect)
}

function cloneRect(rect: DOMRect): ResolvedBox {
	return {
		left: rect.left,
		right: rect.right,
		top: rect.top,
		bottom: rect.bottom,
		width: rect.width,
		height: rect.height,
	}
}

export function validateNodes(nodes: Map<string, CanonicalNode>): void {
	for (const [, node] of nodes) {
		const horizontalCount = Number(node.left !== null) + Number(node.right !== null) + Number(node.width !== null)

		const verticalCount = Number(node.top !== null) + Number(node.bottom !== null) + Number(node.height !== null)

		if (horizontalCount !== 2) {
			throw new Error(
				`[lx] ${describeEl(node.el)} must have exactly 2 horizontal constraints ` +
					`(lx-left, lx-right, lx-width).`,
			)
		}

		if (verticalCount !== 2) {
			throw new Error(
				`[lx] ${describeEl(node.el)} must have exactly 2 vertical constraints ` +
					`(lx-top, lx-bottom, lx-height).`,
			)
		}

		if (node.width?.type === 'range' && node.height?.type === 'range') {
			throw new Error(`[lx] ${describeEl(node.el)} cannot use range for both lx-width and lx-height.`)
		}

		const positionExprs: (PositionExpr | null)[] = [node.left, node.right, node.top, node.bottom]
		for (const expr of positionExprs) {
			if (!expr) continue

			if (expr.type === 'element-ref') {
				if (!nodes.has(expr.targetId)) {
					throw new Error(`[lx] ${describeEl(node.el)} references missing id "#${expr.targetId}".`)
				}
				node.refs.add(expr.targetId)
			}
		}
	}
}

export function detectCycles(nodes: Map<string, CanonicalNode>): void {
	const visiting = new Set<string>()
	const visited = new Set<string>()
	const path: string[] = []

	function dfs(id: string): void {
		if (visited.has(id)) return

		if (visiting.has(id)) {
			const cycleStart = path.indexOf(id)
			const cycle = [...path.slice(cycleStart), id]
				.map((x) => `#${x}`)
				.join(' -> ')
			throw new Error(`[lx] Circular dependency detected: ${cycle}`)
		}

		visiting.add(id)
		path.push(id)

		const node = nodes.get(id)
		if (!node) {
			throw new Error(`[lx] Internal error: node "${id}" not found.`)
		}

		for (const dep of node.refs) {
			dfs(dep)
		}

		path.pop()
		visiting.delete(id)
		visited.add(id)
	}

	for (const id of nodes.keys()) {
		dfs(id)
	}
}

export function topologicalSort(nodes: Map<string, CanonicalNode>): CanonicalNode[] {
	const ordered: CanonicalNode[] = []
	const visited = new Set<string>()

	function visit(id: string): void {
		if (visited.has(id)) return
		visited.add(id)

		const node = nodes.get(id)
		if (!node) {
			throw new Error(`[lx] Internal error: node "${id}" not found.`)
		}

		for (const dep of node.refs) {
			visit(dep)
		}

		ordered.push(node)
	}

	for (const id of nodes.keys()) {
		visit(id)
	}

	return ordered
}
