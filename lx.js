/**
 * @file lx.js
 * @description Canonical-only lx runtime. CSS-first, JS-assisted.
 * It parses canonical lx attributes, validates them, resolves cross-element
 * references into px values, and applies ordinary CSS styles to the DOM.
 */

/**
 * --------------------------------------------------------------------------
 * Type Definitions
 * --------------------------------------------------------------------------
 */

/**
 * @typedef {Object} InitOptions
 * @property {boolean} [debug]
 */

/**
 * @typedef {'left'|'right'|'top'|'bottom'} Edge
 */

/**
 * @typedef {'lx-left'|'lx-right'|'lx-top'|'lx-bottom'} PositionAttrName
 */

/**
 * @typedef {'lx-width'|'lx-height'} SizeAttrName
 */

/**
 * @typedef {'body'|'id'} RefTargetType
 */

/**
 * @typedef {Object} BodyPositionExpr
 * @property {'body-ref'} type
 * @property {Edge} edge
 * @property {number} offset
 * @property {string} raw
 */

/**
 * @typedef {Object} ElementPositionExpr
 * @property {'element-ref'} type
 * @property {string} targetId
 * @property {Edge} edge
 * @property {number} offset
 * @property {string} raw
 */

/**
 * @typedef {BodyPositionExpr | ElementPositionExpr} PositionExpr
 */

/**
 * @typedef {Object} FixedSizeExpr
 * @property {'fixed'} type
 * @property {number} value
 * @property {string} raw
 */

/**
 * @typedef {Object} RangeSizeExpr
 * @property {'range'} type
 * @property {number} min
 * @property {number} max
 * @property {string} raw
 */

/**
 * @typedef {FixedSizeExpr | RangeSizeExpr} SizeExpr
 */

/**
 * @typedef {Object} ResolvedBox
 * @property {number} left
 * @property {number} right
 * @property {number} top
 * @property {number} bottom
 * @property {number} width
 * @property {number} height
 */

/**
 * @typedef {Object} CanonicalNode
 * @property {string} id
 * @property {HTMLElement} el
 * @property {PositionExpr | null} left
 * @property {PositionExpr | null} right
 * @property {PositionExpr | null} top
 * @property {PositionExpr | null} bottom
 * @property {SizeExpr | null} width
 * @property {SizeExpr | null} height
 * @property {Set<string>} refs
 * @property {ResolvedBox | null} resolved
 * @property {CanonicalAttrMap} canonicalAttrs
 */

/**
 * --------------------------------------------------------------------------
 * Constants
 * --------------------------------------------------------------------------
 */

/** @type {readonly PositionAttrName[]} */
const POSITION_ATTRS = /** @type {const} */ (['lx-left', 'lx-right', 'lx-top', 'lx-bottom'])

/** @type {readonly SizeAttrName[]} */
const SIZE_ATTRS = /** @type {const} */ (['lx-width', 'lx-height'])

/** @type {readonly string[]} */
const ALL_ATTRS = [...POSITION_ATTRS, ...SIZE_ATTRS]

/** @type {Readonly<Record<string, string>>} */
const ATTR_ALIASES = Object.freeze({
	'lx-l': 'lx-left',
	'lx-r': 'lx-right',
	'lx-t': 'lx-top',
	'lx-b': 'lx-bottom',
	'lx-w': 'lx-width',
	'lx-h': 'lx-height',
})

/**
 * Matches:
 * - body.left+50
 * - body.top-10
 * - #main.right+20
 * - #info.bottom
 *
 * Groups:
 * 1 => body or #id
 * 2 => id without #
 * 3 => edge
 * 4 => offset
 *
 * @type {RegExp}
 */
const POSITION_RE = /^(body|#([A-Za-z_][\w\-:.]*))\.(left|right|top|bottom)([+-]\d+(?:\.\d+)?)?$/

/**
 * Matches:
 * - previous.left+50
 * - next.top-10
 * - previous.bottom
 * - next.right+20
 *
 * Groups:
 * 1 => previous or next
 * 2 => edge
 * 3 => offset
 *
 * @type {RegExp}
 */
const RELATIVE_POSITION_RE = /^(previous|next)\.(left|right|top|bottom)([+-]\d+(?:\.\d+)?)?$/

/** @type {RegExp} */
const FIXED_SIZE_RE = /^-?\d+(?:\.\d+)?$/

/** @type {RegExp} */
const RANGE_SIZE_RE = /^(-?\d+(?:\.\d+)?)\/(-?\d+(?:\.\d+)?)$/

/**
 * --------------------------------------------------------------------------
 * Utility Functions
 * --------------------------------------------------------------------------
 */

/**
 * @param {HTMLElement} el
 * @returns {string}
 */
function describeEl(el) {
	const id = el.id ? ` id="${el.id}"` : ''
	return `<${el.tagName.toLowerCase()}${id}>`
}

/**
 * @param {Element} el
 * @returns {el is HTMLElement}
 */
function hasLxAttrs(el) {
	if (!(el instanceof HTMLElement)) return false
	if (el.hasAttribute('lx')) return true
	if (ALL_ATTRS.some(attr => el.hasAttribute(attr))) return true
	return Object.keys(ATTR_ALIASES).some(alias => el.hasAttribute(alias))
}

/**
 * --------------------------------------------------------------------------
 * Sugar Transformation
 * --------------------------------------------------------------------------
 */

/**
 * @typedef {Object} CanonicalAttr
 * @property {string} value
 * @property {string} originalAttr
 */

/**
 * @typedef {Object} CanonicalAttrMap
 * @property {CanonicalAttr|undefined} left
 * @property {CanonicalAttr|undefined} right
 * @property {CanonicalAttr|undefined} top
 * @property {CanonicalAttr|undefined} bottom
 * @property {CanonicalAttr|undefined} width
 * @property {CanonicalAttr|undefined} height
 */

/**
 * Checks if a value is a numeric position (pure number).
 * @param {string} value
 * @returns {boolean}
 */
function isNumericPosition(value) {
	return FIXED_SIZE_RE.test(value)
}

/**
 * Converts numeric position to canonical form.
 * @param {string} value
 * @param {'left'|'right'|'top'|'bottom'} edge
 * @param {string} containerId
 * @returns {CanonicalAttr}
 */
function toCanonicalPosition(value, edge, containerId) {
	const offset = parseNumber(value, `numeric position`)
	const ref = containerId === 'body' ? 'body' : `#${containerId}`
	const sign = offset >= 0 ? '+' : ''
	return {
		value: `${ref}.${edge}${sign}${offset}`,
		originalAttr: value,
	}
}

/**
 * Finds the nearest lx ancestor element.
 * @param {HTMLElement} el
 * @param {Set<string>} containerIds
 * @returns {string}
 */
function findNearestLxAncestor(el, containerIds) {
	let current = /** @type {HTMLElement|null} */ (el.parentElement)
	while (current) {
		if (current.id && containerIds.has(current.id)) {
			return current.id
		}
		current = /** @type {HTMLElement|null} */ (current.parentElement)
	}
	return 'body'
}

/**
 * Expands sugar syntax to canonical form.
 * @param {HTMLElement} el
 * @param {Set<string>} containerIds
 * @param {Map<string, string[]>} containerOrderedIds
 * @param {Map<string, CanonicalNode>} nodes
 * @returns {CanonicalAttrMap}
 */
function expandSugarToCanonical(el, containerIds, containerOrderedIds, nodes) {
	/** @type {CanonicalAttrMap} */
	const result = {}

	const aliasToCanonical = {
		'lx-l': 'left',
		'lx-r': 'right',
		'lx-t': 'top',
		'lx-b': 'bottom',
		'lx-w': 'width',
		'lx-h': 'height',
	}

	const positionEdges = ['left', 'right', 'top', 'bottom']
	const sizeEdges = ['width', 'height']

	/** @param {string} value @param {string} edge */
	const expandRelativePosition = (value, edge) => {
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

	for (const [alias, canonical] of Object.entries(aliasToCanonical)) {
		if (el.hasAttribute(alias)) {
			const value = /** @type {string} */ (el.getAttribute(alias))
			if (positionEdges.includes(canonical)) {
				const expanded = expandRelativePosition(value, canonical)
				if (expanded) {
					result[/** @type {keyof CanonicalAttrMap} */ (canonical)] = {
						value: expanded,
						originalAttr: alias,
					}
				} else if (isNumericPosition(value)) {
					const containerId = findNearestLxAncestor(el, containerIds)
					result[/** @type {keyof CanonicalAttrMap} */ (canonical)] = toCanonicalPosition(
						value,
						/** @type {'left'|'right'|'top'|'bottom'} */ (canonical),
						containerId,
					)
				} else {
					result[/** @type {keyof CanonicalAttrMap} */ (canonical)] = {
						value,
						originalAttr: alias,
					}
				}
			} else {
				result[/** @type {keyof CanonicalAttrMap} */ (canonical)] = {
					value,
					originalAttr: alias,
				}
			}
		}
	}

	for (const attr of ALL_ATTRS) {
		if (el.hasAttribute(attr)) {
			const edge = attr.replace('lx-', '')
			const value = /** @type {string} */ (el.getAttribute(attr))
			if (positionEdges.includes(edge)) {
				const expanded = expandRelativePosition(value, edge)
				if (expanded) {
					result[/** @type {keyof CanonicalAttrMap} */ (edge)] = {
						value: expanded,
						originalAttr: attr,
					}
				} else if (isNumericPosition(value)) {
					const containerId = findNearestLxAncestor(el, containerIds)
					result[/** @type {keyof CanonicalAttrMap} */ (edge)] = toCanonicalPosition(
						value,
						/** @type {'left'|'right'|'top'|'bottom'} */ (edge),
						containerId,
					)
				} else {
					result[/** @type {keyof CanonicalAttrMap} */ (edge)] = {
						value,
						originalAttr: attr,
					}
				}
			} else {
				result[/** @type {keyof CanonicalAttrMap} */ (edge)] = {
					value,
					originalAttr: attr,
				}
			}
		}
	}

	return result
}

/**
 * @param {number} value
 * @returns {string}
 */
function px(value) {
	return `${value}px`
}

/**
 * @param {string} raw
 * @param {string} context
 * @returns {number}
 */
function parseNumber(raw, context) {
	const n = Number(raw)
	if (!Number.isFinite(n)) {
		throw new Error(`[lx] Invalid number "${raw}" in ${context}`)
	}
	return n
}

/**
 * @param {DOMRect | {left:number;right:number;top:number;bottom:number;width:number;height:number}} rect
 * @returns {ResolvedBox}
 */
function cloneRect(rect) {
	return {
		left: rect.left,
		right: rect.right,
		top: rect.top,
		bottom: rect.bottom,
		width: rect.width,
		height: rect.height,
	}
}

/**
 * @returns {ResolvedBox}
 */
function getBodyBox() {
	/** @type {number} */
	const width = document.documentElement.clientWidth
	/** @type {number} */
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

/**
 * @param {HTMLElement} el
 * @returns {ResolvedBox}
 */
function readElementBox(el) {
	/** @type {DOMRect} */
	const rect = el.getBoundingClientRect()
	return cloneRect(rect)
}

/**
 * @param {number} value
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
function clamp(value, min, max) {
	return Math.max(min, Math.min(max, value))
}

/**
 * @param {string} text
 * @param {string} [prefix]
 * @returns {string}
 */
function indent(text, prefix = '  ') {
	return text
		.split('\n')
		.map(line => (line ? prefix + line : line))
		.join('\n')
}

/**
 * @param {PositionExpr | null} expr
 * @returns {string}
 */
function formatPositionExpr(expr) {
	if (!expr) return ''

	if (expr.type === 'body-ref') {
		return `body.${expr.edge}${expr.offset >= 0 ? '+' : ''}${expr.offset}`
	}

	return `#${expr.targetId}.${expr.edge}${expr.offset >= 0 ? '+' : ''}${expr.offset}`
}

/**
 * @param {SizeExpr | null} expr
 * @returns {string}
 */
function formatSizeExpr(expr) {
	if (!expr) return ''

	if (expr.type === 'fixed') {
		return String(expr.value)
	}

	return `${expr.min}/${expr.max}`
}

/**
 * @param {CanonicalNode} node
 * @returns {{
 *   id: string,
 *   left: string,
 *   right: string,
 *   top: string,
 *   bottom: string,
 *   width: string,
 *   height: string,
 *   refs: string
 * }}
 */
function canonicalRow(node) {
	return {
		id: `#${node.id}`,
		left: formatPositionExpr(node.left),
		right: formatPositionExpr(node.right),
		top: formatPositionExpr(node.top),
		bottom: formatPositionExpr(node.bottom),
		width: formatSizeExpr(node.width),
		height: formatSizeExpr(node.height),
		refs: Array.from(node.refs)
			.map(id => `#${id}`)
			.join(', '),
	}
}

/**
 * @param {CanonicalNode} node
 * @returns {{
 *   id: string,
 *   left: number|string,
 *   top: number|string,
 *   right: number|string,
 *   bottom: number|string,
 *   width: number|string,
 *   height: number|string
 * }}
 */
function resolvedRow(node) {
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

/**
 * @param {Map<string, CanonicalNode>} nodes
 * @returns {void}
 */
function printParsedNodes(nodes) {
	/** @type {ReturnType<typeof canonicalRow>[]} */
	const rows = []

	for (const [, node] of nodes) {
		rows.push(canonicalRow(node))
	}

	console.log('%c[lx] Parsed canonical nodes', 'color:#3498db;font-weight:bold;')
	console.table(rows)
}

/**
 * @param {CanonicalNode} node
 * @returns {{
 *   id: string,
 *   left: string,
 *   right: string,
 *   top: string,
 *   bottom: string,
 *   width: string,
 *   height: string
 * }}
 */
function canonicalAttrsRow(node) {
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

/**
 * @param {Map<string, CanonicalNode>} nodes
 * @returns {void}
 */
function printCanonicalNodes(nodes) {
	/** @type {ReturnType<typeof canonicalAttrsRow>[]} */
	const rows = []

	for (const [, node] of nodes) {
		rows.push(canonicalAttrsRow(node))
	}

	console.log('%c[lx] Canonical called', 'color:#e74c3c;font-weight:bold;')
	console.table(rows)
}

/**
 * @param {CanonicalNode[]} ordered
 * @returns {void}
 */
function printDependencyOrder(ordered) {
	console.log('%c[lx] Dependency order', 'color:#9b59b6;font-weight:bold;')
	console.log(ordered.map(node => `#${node.id}`).join(' -> '))
}

/**
 * @param {Map<string, CanonicalNode>} nodes
 * @returns {void}
 */
function printResolvedNodes(nodes) {
	/** @type {ReturnType<typeof resolvedRow>[]} */
	const rows = []

	for (const [, node] of nodes) {
		rows.push(resolvedRow(node))
	}

	console.log('%c[lx] Resolved boxes', 'color:#27ae60;font-weight:bold;')
	console.table(rows)
}

/**
 * @param {CanonicalNode} node
 * @returns {{
 *   id: string,
 *   cssLeft: string,
 *   cssTop: string,
 *   cssWidth: string,
 *   cssHeight: string
 * }}
 */
function appliedCssRow(node) {
	return {
		id: `#${node.id}`,
		cssLeft: node.el.style.left || '',
		cssTop: node.el.style.top || '',
		cssWidth: node.el.style.width || '',
		cssHeight: node.el.style.height || '',
	}
}

/**
 * @param {Map<string, CanonicalNode>} nodes
 * @returns {void}
 */
function printAppliedCss(nodes) {
	/** @type {ReturnType<typeof appliedCssRow>[]} */
	const rows = []

	for (const [, node] of nodes) {
		rows.push(appliedCssRow(node))
	}

	console.log('%c[lx] Applied CSS', 'color:#e67e22;font-weight:bold;')
	console.table(rows)
}

/**
 * Returns the nearest ancestor CanonicalNode that acts as the containing block.
 * If none exists, body is used.
 *
 * @param {CanonicalNode} node
 * @param {Map<string, CanonicalNode>} nodes
 * @returns {CanonicalNode | null}
 */
function findContainingBlock(node, nodes) {
	/** @type {HTMLElement | null} */
	let current = node.el.parentElement

	while (current && current !== document.body) {
		if (current.id && nodes.has(current.id)) {
			return /** @type {CanonicalNode} */ (nodes.get(current.id))
		}
		current = current.parentElement
	}

	return null
}

/**
 * --------------------------------------------------------------------------
 * Parsing
 * --------------------------------------------------------------------------
 */

/**
 * @param {string} raw
 * @param {PositionAttrName} attrName
 * @param {HTMLElement} el
 * @returns {PositionExpr}
 */
function parsePositionExpr(raw, attrName, el) {
	/** @type {string} */
	const value = String(raw).trim()

	/** @type {RegExpMatchArray | null} */
	const match = value.match(POSITION_RE)

	if (!match) {
		throw new Error(
			`[lx] Invalid ${attrName}="${value}" on ${describeEl(el)}. ` + `Expected "body.edge+N" or "#id.edge+N".`,
		)
	}

	/** @type {string} */
	const targetToken = match[1]
	/** @type {string | null} */
	const targetId = match[2] || null
	/** @type {Edge} */
	const edge = /** @type {Edge} */ (match[3])
	/** @type {number} */
	const offset = match[4] ? Number(match[4]) : 0

	if (targetToken === 'body') {
		/** @type {BodyPositionExpr} */
		const expr = {
			type: 'body-ref',
			edge,
			offset,
			raw: value,
		}
		return expr
	}

	/** @type {ElementPositionExpr} */
	const expr = {
		type: 'element-ref',
		targetId: /** @type {string} */ (targetId),
		edge,
		offset,
		raw: value,
	}
	return expr
}

/**
 * @param {string} raw
 * @param {SizeAttrName} attrName
 * @param {HTMLElement} el
 * @returns {SizeExpr}
 */
function parseSizeExpr(raw, attrName, el) {
	/** @type {string} */
	const value = String(raw).trim()

	if (FIXED_SIZE_RE.test(value)) {
		/** @type {FixedSizeExpr} */
		const expr = {
			type: 'fixed',
			value: Number(value),
			raw: value,
		}
		return expr
	}

	/** @type {RegExpMatchArray | null} */
	const rangeMatch = value.match(RANGE_SIZE_RE)
	if (rangeMatch) {
		/** @type {number} */
		const min = Number(rangeMatch[1])
		/** @type {number} */
		const max = Number(rangeMatch[2])

		if (min > max) {
			throw new Error(`[lx] Invalid ${attrName}="${value}" on ${describeEl(el)}: min > max.`)
		}

		/** @type {RangeSizeExpr} */
		const expr = {
			type: 'range',
			min,
			max,
			raw: value,
		}
		return expr
	}

	throw new Error(`[lx] Invalid ${attrName}="${value}" on ${describeEl(el)}. ` + `Expected "300" or "200/500".`)
}

/**
 * --------------------------------------------------------------------------
 * Collection
 * --------------------------------------------------------------------------
 */

/**
 * @param {ParentNode} root
 * @returns {{nodes: Map<string, CanonicalNode>, containerOrderedIds: Map<string, string[]>}}
 */
function collectNodes(root) {
	/** @type {HTMLElement[]} */
	const elements = Array.from(root.querySelectorAll('*')).filter(hasLxAttrs)

	/** @type {Set<string>} */
	const containerIds = new Set()

	for (const el of elements) {
		if (el.hasAttribute('lx')) {
			if (!el.id) {
				throw new Error(`[lx] Container elements with lx attribute must have an id: ${describeEl(el)}`)
			}
			containerIds.add(el.id)
		}
	}

	/** @type {Map<string, CanonicalNode>} */
	const nodes = new Map()

	/** @type {Map<string, string[]>} */
	const containerOrderedIds = new Map()

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
		containerOrderedIds.get(containerId).push(el.id)

		/** @type {CanonicalNode} */
		const node = {
			id: el.id,
			el,
			left: null,
			right: null,
			top: null,
			bottom: null,
			width: null,
			height: null,
			refs: new Set(),
			resolved: null,
			canonicalAttrs: /** @type {CanonicalAttrMap} */ ({}),
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
	}

	return { nodes, containerOrderedIds }
}

/**
 * --------------------------------------------------------------------------
 * Validation
 * --------------------------------------------------------------------------
 */

/**
 * @param {Map<string, CanonicalNode>} nodes
 * @returns {void}
 */
function validateNodes(nodes) {
	for (const [, node] of nodes) {
		/** @type {number} */
		const horizontalCount = Number(node.left !== null) + Number(node.right !== null) + Number(node.width !== null)

		/** @type {number} */
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

		/** @type {(PositionExpr | null)[]} */
		const positionExprs = [node.left, node.right, node.top, node.bottom]
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

/**
 * @param {Map<string, CanonicalNode>} nodes
 * @returns {void}
 */
function detectCycles(nodes) {
	/** @type {Set<string>} */
	const visiting = new Set()
	/** @type {Set<string>} */
	const visited = new Set()
	/** @type {string[]} */
	const path = []

	/**
	 * @param {string} id
	 * @returns {void}
	 */
	function dfs(id) {
		if (visited.has(id)) return

		if (visiting.has(id)) {
			/** @type {number} */
			const cycleStart = path.indexOf(id)
			/** @type {string} */
			const cycle = [...path.slice(cycleStart), id].map(x => `#${x}`).join(' -> ')
			throw new Error(`[lx] Circular dependency detected: ${cycle}`)
		}

		visiting.add(id)
		path.push(id)

		/** @type {CanonicalNode | undefined} */
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

/**
 * @param {Map<string, CanonicalNode>} nodes
 * @returns {CanonicalNode[]}
 */
function topologicalSort(nodes) {
	/** @type {CanonicalNode[]} */
	const ordered = []
	/** @type {Set<string>} */
	const visited = new Set()

	/**
	 * @param {string} id
	 * @returns {void}
	 */
	function visit(id) {
		if (visited.has(id)) return
		visited.add(id)

		/** @type {CanonicalNode | undefined} */
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

/**
 * --------------------------------------------------------------------------
 * CSS Helpers
 * --------------------------------------------------------------------------
 */

/**
 * Ensures an element can be used as positioned container target if needed.
 *
 * @param {HTMLElement} el
 * @returns {void}
 */
function ensurePositionable(el) {
	/** @type {CSSStyleDeclaration} */
	const style = window.getComputedStyle(el)

	if (style.position === 'static') {
		el.style.position = 'absolute'
	}

	el.style.boxSizing = 'border-box'
}

/**
 * @param {CanonicalNode} node
 * @returns {void}
 */
function applyBaseSizeCSS(node) {
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

/**
 * @param {CanonicalNode} node
 * @returns {void}
 */
function clearInsetCSS(node) {
	node.el.style.left = ''
	node.el.style.right = ''
	node.el.style.top = ''
	node.el.style.bottom = ''
}

/**
 * --------------------------------------------------------------------------
 * Resolution
 * --------------------------------------------------------------------------
 */

/**
 * Resolves a position expression into an absolute viewport coordinate.
 *
 * @param {PositionExpr} expr
 * @param {Map<string, CanonicalNode>} nodes
 * @returns {number}
 */
function resolvePositionExpr(expr, nodes) {
	if (expr.type === 'body-ref') {
		/** @type {ResolvedBox} */
		const bodyBox = getBodyBox()
		return bodyBox[expr.edge] + expr.offset
	}

	/** @type {CanonicalNode | undefined} */
	const targetNode = nodes.get(expr.targetId)
	if (!targetNode || !targetNode.resolved) {
		throw new Error(`[lx] Cannot resolve reference "#${expr.targetId}".`)
	}

	return targetNode.resolved[expr.edge] + expr.offset
}

/**
 * Resolves a node into an absolute viewport box.
 *
 * This does not attempt to solve arbitrary constraints. It only supports the
 * canonical rule that each axis has exactly 2 constraints.
 *
 * @param {CanonicalNode} node
 * @param {Map<string, CanonicalNode>} nodes
 * @returns {ResolvedBox}
 */
function resolveNode(node, nodes) {
	/** @type {number | undefined} */
	let left
	/** @type {number | undefined} */
	let right
	/** @type {number | undefined} */
	let top
	/** @type {number | undefined} */
	let bottom
	/** @type {number | undefined} */
	let width
	/** @type {number | undefined} */
	let height

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

	// Width / Height pre-application:
	// - fixed: known now
	// - range: let CSS determine it first, then read actual box later
	if (node.width?.type === 'fixed') {
		width = node.width.value
	}
	if (node.height?.type === 'fixed') {
		height = node.height.value
	}

	/**
	 * First pass: if any range dimension exists, let CSS establish the rendered
	 * size, then read the actual size from the DOM.
	 */
	if (node.width?.type === 'range' || node.height?.type === 'range') {
		// Apply whatever inset is already computable so CSS can size content properly.
		clearInsetCSS(node)

		if (left !== undefined) node.el.style.left = px(left)
		if (right !== undefined) node.el.style.right = px(right)
		if (top !== undefined) node.el.style.top = px(top)
		if (bottom !== undefined) node.el.style.bottom = px(bottom)

		/** @type {ResolvedBox} */
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

	// Final solve per axis
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

	/** @type {ResolvedBox} */
	const box = {
		left,
		right,
		top,
		bottom,
		width,
		height,
	}

	return box
}

/**
 * Applies a resolved box as regular CSS.
 * The resolved box is in viewport coordinates, but CSS left/top for absolute
 * positioning must be relative to the containing block.
 *
 * @param {CanonicalNode} node
 * @param {ResolvedBox} box
 * @param {Map<string, CanonicalNode>} nodes
 * @returns {void}
 */
function applyResolvedBox(node, box, nodes) {
	ensurePositionable(node.el)

	/** @type {CanonicalNode | null} */
	const container = findContainingBlock(node, nodes)

	/** @type {number} */
	const baseLeft = container && container.resolved ? container.resolved.left : 0
	/** @type {number} */
	const baseTop = container && container.resolved ? container.resolved.top : 0

	/** @type {number} */
	const cssLeft = box.left - baseLeft
	/** @type {number} */
	const cssTop = box.top - baseTop

	node.el.style.left = px(cssLeft)
	node.el.style.top = px(cssTop)
	node.el.style.width = px(box.width)
	node.el.style.height = px(box.height)
	node.el.style.right = ''
	node.el.style.bottom = ''
}

/**
 * --------------------------------------------------------------------------
 * Cached State (Module Scope)
 * --------------------------------------------------------------------------
 */

/** @type {Map<string, CanonicalNode> | null} */
let cachedNodesMap = null

/** @type {CanonicalNode[] | null} */
let cachedOrderedNodes = null

/** @type {boolean} */
let cachedDebug = false

/** @type {Map<string, string[]> | null} */
let cachedContainerOrderedIds = null

/**
 * --------------------------------------------------------------------------
 * Main
 * --------------------------------------------------------------------------
 */

/**
 * Performs full initialization: collects nodes, validates, detects cycles,
 * and builds the dependency graph. Call this once on page load or when
 * the lx-* structure changes.
 *
 * @param {ParentNode} [root=document.body]
 * @param {InitOptions} [options={}]
 * @returns {void}
 */
function setup(root = document.body, options = {}) {
	cachedDebug = Boolean(options.debug)

	const { nodes, containerOrderedIds } = collectNodes(root)
	cachedNodesMap = nodes
	cachedContainerOrderedIds = containerOrderedIds

	validateNodes(cachedNodesMap)
	detectCycles(cachedNodesMap)

	cachedOrderedNodes = topologicalSort(cachedNodesMap)

	if (cachedDebug) {
		printCanonicalNodes(cachedNodesMap)
		printParsedNodes(cachedNodesMap)
		printDependencyOrder(cachedOrderedNodes)
	}

	update()
}

/**
 * Performs incremental update: resolves positions and applies CSS based on
 * cached dependency graph. Does NOT perform any DOM scanning or regex parsing.
 * Use after viewport changes (resize, scroll) or content changes.
 *
 * @returns {void}
 */
function update() {
	if (!cachedNodesMap || !cachedOrderedNodes) {
		console.warn('[lx] update() called before setup(). Run setup() first.')
		return
	}

	const nodes = cachedNodesMap
	const ordered = cachedOrderedNodes

	for (const node of ordered) {
		applyBaseSizeCSS(node)
	}

	for (const node of ordered) {
		/** @type {ResolvedBox} */
		const box = resolveNode(node, nodes)
		node.resolved = box
		applyResolvedBox(node, box, nodes)
	}

	if (cachedDebug) {
		printResolvedNodes(nodes)
		printAppliedCss(nodes)
	}
}

/**
 * @returns {void}
 */
function boot() {
	try {
		/** @type {URLSearchParams} */
		const params = new URLSearchParams(window.location.search)
		/** @type {boolean} */
		const debug = params.has('lx-debug')

		setup(document.body, { debug })
	} catch (error) {
		console.error('%c[lx] Error', 'color:#e74c3c;font-weight:bold;')
		console.error(error)
	}
}

if (document.readyState === 'loading') {
	document.addEventListener('DOMContentLoaded', boot)
} else {
	boot()
}

/**
 * @type {{ setup: (root?: ParentNode, options?: InitOptions) => void, update: () => void }}
 */
window.lx = { setup, update }
