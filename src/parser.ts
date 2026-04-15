import {
	CanonicalAttrMap,
	CanonicalNode,
	Edge,
	ElementPositionExpr,
	BodyPositionExpr,
	FixedSizeExpr,
	RangeSizeExpr,
	AspectExpr,
	SizeExpr,
	PositionExpr,
	PositionAttrName,
	SizeAttrName,
	POSITION_RE,
	RELATIVE_POSITION_RE,
	FIXED_SIZE_RE,
	RANGE_SIZE_RE,
	ASPECT_RE,
	EXPRESSION_RE,
	POSITION_EXPR_RE,
	VARIABLE_RE,
	MATH_TOKEN_RE,
	ATTR_ALIASES,
	ALL_ATTRS,
	ASPECT_ATTR,
} from './types'

export function describeEl(el: HTMLElement): string {
	const id = el.id ? ` id="${el.id}"` : ''
	return `<${el.tagName.toLowerCase()}${id}>`
}

export function hasLxAttrs(el: Element): el is HTMLElement {
	if (!(el instanceof HTMLElement)) return false
	if (el.hasAttribute('lx')) return true
	if (ALL_ATTRS.some((attr) => el.hasAttribute(attr))) return true
	return Object.keys(ATTR_ALIASES).some((alias) => el.hasAttribute(alias))
}

export function getVariable(el: HTMLElement, name: string): number {
	let current: HTMLElement | null = el

	while (current && current !== document.body) {
		const attrName = `data-lx-${name}`
		if (current.hasAttribute(attrName)) {
			const rawValue = current.getAttribute(attrName)
			if (rawValue === null) {
				throw new Error(`[lx] Variable "${name}" on ${describeEl(current)} has null value.`)
			}
			const numValue = Number(rawValue)

			if (!Number.isFinite(numValue)) {
				throw new Error(
					`[lx] Variable "${name}" on ${describeEl(current)} has non-numeric value "${rawValue}".`,
				)
			}

			return numValue
		}
		current = current.parentElement
	}

	if (current === document.body && current.hasAttribute(`data-lx-${name}`)) {
		const rawValue = current.getAttribute(`data-lx-${name}`)
		if (rawValue === null) {
			throw new Error(`[lx] Variable "${name}" on <body> has null value.`)
		}
		const numValue = Number(rawValue)

		if (!Number.isFinite(numValue)) {
			throw new Error(`[lx] Variable "${name}" on <body> has non-numeric value "${rawValue}".`)
		}

		return numValue
	}

	throw new Error(`[lx] Undefined variable: ${name}`)
}

function hasNestedParentheses(expr: string): boolean {
	let depth = 0
	for (const char of expr) {
		if (char === '(') {
			depth++
			if (depth > 1) return true
		} else if (char === ')') {
			depth--
		}
	}
	return false
}

function tokenizeMathExpr(expr: string, el: HTMLElement): (number | string)[] {
	const tokens = expr.split(MATH_TOKEN_RE).filter((t) => t.trim() !== '')
	return tokens.map((token) => {
		if (VARIABLE_RE.test(token)) {
			const varName = token.slice(1, -1)
			return getVariable(el, varName)
		}

		const num = Number(token)
		if (Number.isFinite(num)) {
			return num
		}

		if (['+', '-', '*', '/'].includes(token)) {
			return token
		}

		throw new Error(`[lx] Invalid token "${token}" in expression "${expr}" on ${describeEl(el)}.`)
	})
}

export function evaluateMath(expr: string, el: HTMLElement): number {
	if (hasNestedParentheses(expr)) {
		throw new Error(`[lx] Nested parentheses are not supported: (${expr})`)
	}

	let innerExpr = expr
	if (EXPRESSION_RE.test(expr)) {
		innerExpr = expr.replace(/^\(|\)$/g, '')
	}

	// Handle unary operators: -{var} -> 0-{var}
	const unaryOpMatch = innerExpr.match(/^([+\-]+)(.+)$/)
	if (unaryOpMatch) {
		const op = unaryOpMatch[1]
		const rest = unaryOpMatch[2]
		if (!/^[+\-]?\d/.test(rest)) {
			innerExpr = `0${op}${rest}`
		}
	}

	const tokens = tokenizeMathExpr(innerExpr, el)

	if (tokens.length === 0) {
		throw new Error(`[lx] Empty expression on ${describeEl(el)}.`)
	}

	const nums: number[] = []
	const ops: string[] = []

	let expectNumber = true

	for (const token of tokens) {
		if (expectNumber) {
			if (typeof token !== 'number') {
				throw new Error(`[lx] Unexpected operator "${token}" in expression "${expr}" on ${describeEl(el)}.`)
			}
			nums.push(token)
			expectNumber = false
		} else {
			if (typeof token === 'number') {
				throw new Error(`[lx] Unexpected number "${token}" in expression "${expr}" on ${describeEl(el)}.`)
			}
			if (!['+', '-', '*', '/'].includes(token)) {
				throw new Error(`[lx] Invalid operator "${token}" in expression "${expr}" on ${describeEl(el)}.`)
			}
			ops.push(token)
			expectNumber = true
		}
	}

	if (expectNumber) {
		throw new Error(`[lx] Expression ends with operator on ${describeEl(el)}.`)
	}

	let i = 0
	while (i < ops.length) {
		if (ops[i] === '*' || ops[i] === '/') {
			const left = nums[i]
			const right = nums[i + 1]
			const op = ops[i]

			if (op === '/' && right === 0) {
				throw new Error(`[lx] Division by zero in expression "${expr}" on ${describeEl(el)}.`)
			}

			const result = op === '*' ? left * right : left / right
			nums.splice(i, 2, result)
			ops.splice(i, 1)
		} else {
			i++
		}
	}

	i = 0
	while (i < ops.length) {
		const left = nums[i]
		const right = nums[i + 1]
		const op = ops[i]

		const result = op === '+' ? left + right : left - right
		nums.splice(i, 2, result)
		ops.splice(i, 1)
	}

	return nums[0]
}

export function resolveValue(input: string, el: HTMLElement): number {
	const trimmed = input.trim()

	const varMatch = trimmed.match(VARIABLE_RE)
	if (varMatch) {
		return getVariable(el, varMatch[1])
	}

	const exprMatch = trimmed.match(EXPRESSION_RE)
	if (exprMatch) {
		return evaluateMath(exprMatch[1], el)
	}

	const num = Number(trimmed)
	if (Number.isFinite(num)) {
		return num
	}

	throw new Error(`[lx] Cannot resolve value "${input}" on ${describeEl(el)}.`)
}

function isNumericPosition(value: string): boolean {
	return FIXED_SIZE_RE.test(value)
}

function parseNumber(raw: string, context: string): number {
	const n = Number(raw)
	if (!Number.isFinite(n)) {
		throw new Error(`[lx] Invalid number "${raw}" in ${context}`)
	}
	return n
}

export function toCanonicalPosition(value: string, edge: Edge, containerId: string): { value: string; originalAttr: string } {
	const offset = parseNumber(value, `numeric position`)
	const ref = containerId === 'body' ? 'body' : `#${containerId}`
	const sign = offset >= 0 ? '+' : ''
	return {
		value: `${ref}.${edge}${sign}${offset}`,
		originalAttr: value,
	}
}

export function findNearestLxAncestor(el: HTMLElement, containerIds: Set<string>): string {
	let current: HTMLElement | null = el.parentElement
	while (current) {
		if (current.id && containerIds.has(current.id)) {
			return current.id
		}
		current = current.parentElement
	}
	return 'body'
}

export function expandSugarToCanonical(
	el: HTMLElement,
	containerIds: Set<string>,
	containerOrderedIds: Map<string, string[]>,
	nodes: Map<string, CanonicalNode>,
): CanonicalAttrMap {
	const result: CanonicalAttrMap = {}

	const aliasToCanonical: Record<string, string> = {
		'lx-l': 'left',
		'lx-r': 'right',
		'lx-t': 'top',
		'lx-b': 'bottom',
		'lx-w': 'width',
		'lx-h': 'height',
		'lx-a': 'aspect',
	}

	const positionEdges = ['left', 'right', 'top', 'bottom']

	const expandRelativePosition = (value: string, _edge: string): string | null => {
		const match = value.match(RELATIVE_POSITION_RE)
		if (!match) return null

		const keyword = match[1]
		const targetEdge = match[2]
		const offset = match[3] ? Number(match[3]) : 0

		const containerId = findNearestLxAncestor(el, containerIds)
		const orderedIds = containerOrderedIds.get(containerId) || []

		if (orderedIds.length === 0) {
			throw new Error(`[lx] ${describeEl(el)} cannot use "${keyword}" - container has no elements.`)
		}

		const currentIndex = orderedIds.indexOf(el.id)
		let targetIndex

		if (keyword === 'previous') {
			targetIndex = currentIndex - 1
			if (targetIndex < 0) {
				throw new Error(`[lx] ${describeEl(el)} is the first element in container "${containerId}" and cannot use "previous".`)
			}
		} else {
			targetIndex = currentIndex + 1
			if (targetIndex >= orderedIds.length) {
				throw new Error(`[lx] ${describeEl(el)} is the last element in container "${containerId}" and cannot use "next".`)
			}
		}

		const targetId = orderedIds[targetIndex]
		const sign = offset >= 0 ? '+' : ''
		return `#${targetId}.${targetEdge}${sign}${offset}`
	}

	const expandPositionWithExpression = (value: string, _el: HTMLElement): string | null => {
		const exprMatch = value.match(POSITION_EXPR_RE)
		if (!exprMatch) return null

		const ref = exprMatch[1]
		const edge = exprMatch[3]
		const originalSign = exprMatch[4]
		const rawExpr = exprMatch[5]

		const exprMatch2 = rawExpr.match(EXPRESSION_RE)
		if (!exprMatch2) return null

		const evaluated = evaluateMath(exprMatch2[1], el)
		const finalValue = originalSign === '-' ? -evaluated : evaluated
		const signStr = finalValue >= 0 ? '+' : ''

		return `${ref}.${edge}${signStr}${finalValue}`
	}

	const convertPositionToCanonical = (value: string, edge: Edge, el: HTMLElement): string => {
		const expandedExpr = expandPositionWithExpression(value, el)
		if (expandedExpr) return expandedExpr

		const expanded = expandRelativePosition(value, edge)
		if (expanded) return expanded

		if (POSITION_RE.test(value)) {
			return value
		}

		if (isNumericPosition(value)) {
			const containerId = findNearestLxAncestor(el, containerIds)
			return toCanonicalPosition(value, edge, containerId).value
		}

		const evaluated = resolveValue(value, el)
		const containerId = findNearestLxAncestor(el, containerIds)
		const ref = containerId === 'body' ? 'body' : `#${containerId}`
		const sign = evaluated >= 0 ? '+' : ''
		return `${ref}.${edge}${sign}${evaluated}`
	}

	for (const [alias, canonical] of Object.entries(aliasToCanonical)) {
		if (el.hasAttribute(alias)) {
			const value = el.getAttribute(alias)
			if (value === null) continue

			if (positionEdges.includes(canonical)) {
				const canonicalValue = convertPositionToCanonical(value, canonical as Edge, el)
				result[canonical as keyof CanonicalAttrMap] = {
					value: canonicalValue,
					originalAttr: alias,
				}
			} else if (canonical === 'aspect') {
				result.aspect = {
					value,
					originalAttr: alias,
				}
			} else {
				if (RANGE_SIZE_RE.test(value)) {
					const parts = value.split('/')
					const min = resolveValue(parts[0], el)
					const max = resolveValue(parts[1], el)
					result[canonical as keyof CanonicalAttrMap] = {
						value: `${min}/${max}`,
						originalAttr: alias,
					}
				} else {
					const evaluated = resolveValue(value, el)
					result[canonical as keyof CanonicalAttrMap] = {
						value: String(evaluated),
						originalAttr: alias,
					}
				}
			}
		}
	}

	for (const attr of ALL_ATTRS) {
		if (el.hasAttribute(attr)) {
			const edge = attr.replace('lx-', '')
			const value = el.getAttribute(attr)
			if (value === null) continue

			if (positionEdges.includes(edge)) {
				const canonicalValue = convertPositionToCanonical(value, edge as Edge, el)
				result[edge as keyof CanonicalAttrMap] = {
					value: canonicalValue,
					originalAttr: attr,
				}
			} else if (edge === 'aspect') {
				result.aspect = {
					value,
					originalAttr: attr,
				}
			} else {
				if (RANGE_SIZE_RE.test(value)) {
					const parts = value.split('/')
					const min = resolveValue(parts[0], el)
					const max = resolveValue(parts[1], el)
					result[edge as keyof CanonicalAttrMap] = {
						value: `${min}/${max}`,
						originalAttr: attr,
					}
				} else {
					const evaluated = resolveValue(value, el)
					result[edge as keyof CanonicalAttrMap] = {
						value: String(evaluated),
						originalAttr: attr,
					}
				}
			}
		}
	}

	return result
}

export function parsePositionExpr(raw: string, attrName: PositionAttrName, el: HTMLElement): PositionExpr {
	const value = String(raw).trim()

	const match = value.match(POSITION_RE)

	if (!match) {
		throw new Error(
			`[lx] Invalid ${attrName}="${value}" on ${describeEl(el)}. ` + `Expected "body.edge+N" or "#id.edge+N".`,
		)
	}

	const targetToken = match[1]
	const targetId = match[2] || null
	const edge: Edge = match[3] as Edge
	const offset = match[4] ? Number(match[4]) : 0

	if (targetToken === 'body') {
		const expr: BodyPositionExpr = {
			type: 'body-ref',
			edge,
			offset,
			raw: value,
		}
		return expr
	}

	const expr: ElementPositionExpr = {
		type: 'element-ref',
		targetId: targetId as string,
		edge,
		offset,
		raw: value,
	}
	return expr
}

export function parseSizeExpr(raw: string, attrName: SizeAttrName, el: HTMLElement): SizeExpr {
	const value = String(raw).trim()

	if (FIXED_SIZE_RE.test(value)) {
		const expr: FixedSizeExpr = {
			type: 'fixed',
			value: Number(value),
			raw: value,
		}
		return expr
	}

	const rangeMatch = value.match(RANGE_SIZE_RE)
	if (rangeMatch) {
		const min = Number(rangeMatch[1])
		const max = Number(rangeMatch[2])

		if (min > max) {
			throw new Error(`[lx] Invalid ${attrName}="${value}" on ${describeEl(el)}: min > max.`)
		}

		const expr: RangeSizeExpr = {
			type: 'range',
			min,
			max,
			raw: value,
		}
		return expr
	}

	throw new Error(`[lx] Invalid ${attrName}="${value}" on ${describeEl(el)}. ` + `Expected "300" or "200/500".`)
}

export function parseAspectExpr(raw: string, el: HTMLElement): AspectExpr {
	const value = String(raw).trim()
	const match = value.match(ASPECT_RE)

	if (!match) {
		throw new Error(`[lx] Invalid ${ASPECT_ATTR}="${value}" on ${describeEl(el)}. Expected "W:H" format (e.g., "16:9").`)
	}

	const w = Number(match[1])
	const h = Number(match[2])

	if (w <= 0 || h <= 0) {
		throw new Error(`[lx] Invalid ${ASPECT_ATTR}="${value}" on ${describeEl(el)}: W and H must be positive numbers.`)
	}

	const expr: AspectExpr = {
		type: 'aspect',
		width: w,
		height: h,
		ratio: w / h,
		raw: value,
	}
	return expr
}

export function collectNodes(root: ParentNode): { nodes: Map<string, CanonicalNode>; containerOrderedIds: Map<string, string[]> } {
	const elements = Array.from(root.querySelectorAll('*')).filter(hasLxAttrs)

	const containerIds = new Set<string>()

	for (const el of elements) {
		if (el.hasAttribute('lx')) {
			if (!el.id) {
				throw new Error(`[lx] Container elements with lx attribute must have an id: ${describeEl(el)}`)
			}
			containerIds.add(el.id)
		}
	}

	const nodes = new Map<string, CanonicalNode>()

	const containerOrderedIds = new Map<string, string[]>()

	for (const el of elements) {
		if (!el.id) {
			throw new Error(`[lx] Elements with lx-* attributes must have an id: ${describeEl(el)}`)
		}

		if (nodes.has(el.id)) {
			throw new Error(`[lx] Duplicate id "${el.id}".`)
		}

		const containerId = findNearestLxAncestor(el, containerIds)

		if (!containerOrderedIds.has(containerId)) {
			containerOrderedIds.set(containerId, [])
		}
		const ordered = containerOrderedIds.get(containerId)
		if (ordered) {
			ordered.push(el.id)
		}

		const node: CanonicalNode = {
			id: el.id,
			el,
			left: null,
			right: null,
			top: null,
			bottom: null,
			width: null,
			height: null,
			aspect: null,
			refs: new Set(),
			resolved: null,
			canonicalAttrs: {},
		}

		nodes.set(node.id, node)
	}

	for (const el of elements) {
		const node = nodes.get(el.id)
		if (!node) continue

		const canonicalAttrs = expandSugarToCanonical(el, containerIds, containerOrderedIds, nodes)

		node.canonicalAttrs = canonicalAttrs
		node.left = canonicalAttrs.left ? parsePositionExpr(canonicalAttrs.left.value, 'lx-left', el) : null
		node.right = canonicalAttrs.right ? parsePositionExpr(canonicalAttrs.right.value, 'lx-right', el) : null
		node.top = canonicalAttrs.top ? parsePositionExpr(canonicalAttrs.top.value, 'lx-top', el) : null
		node.bottom = canonicalAttrs.bottom ? parsePositionExpr(canonicalAttrs.bottom.value, 'lx-bottom', el) : null
		node.width = canonicalAttrs.width ? parseSizeExpr(canonicalAttrs.width.value, 'lx-width', el) : null
		node.height = canonicalAttrs.height ? parseSizeExpr(canonicalAttrs.height.value, 'lx-height', el) : null
		node.aspect = canonicalAttrs.aspect ? parseAspectExpr(canonicalAttrs.aspect.value, el) : null
	}

	return { nodes, containerOrderedIds }
}
