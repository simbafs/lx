import { CanonicalNode, InitOptions } from './types'
import { collectNodes } from './parser'
import {
	validateNodes,
	detectCycles,
	topologicalSort,
	resolveNode,
} from './resolver'
import {
	applyBaseSizeCSS,
	applyResolvedBox,
	printCanonicalNodes,
	printParsedNodes,
	printDependencyOrder,
	printResolvedNodes,
	printAppliedCss,
} from './dom'

let cachedNodesMap: Map<string, CanonicalNode> | null = null

let cachedOrderedNodes: CanonicalNode[] | null = null

let cachedDebug = false

export function setup(root: ParentNode = document.body, options: InitOptions = {}): void {
	cachedDebug = Boolean(options.debug)

	const { nodes, containerOrderedIds } = collectNodes(root)
	cachedNodesMap = nodes

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

export function update(): void {
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
		const box = resolveNode(node, nodes)
		node.resolved = box
		applyResolvedBox(node, box, nodes)
	}

	if (cachedDebug) {
		printResolvedNodes(nodes)
		printAppliedCss(nodes)
	}
}

export function boot(): void {
	try {
		const params = new URLSearchParams(window.location.search)
		const debug = params.has('lx-debug')

		setup(document.body, { debug })
	} catch (error) {
		console.error('%c[lx] Error', 'color:#e74c3c;font-weight:bold;')
		console.error(error)
	}
}

if (typeof window !== 'undefined') {
	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', boot)
	} else {
		boot()
	}

	window.lx = { setup, update }
}
