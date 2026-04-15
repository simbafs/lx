let rafPending = false

let updateInProgress = false

let resizeObserver: ResizeObserver | null = null

let mutationObserver: MutationObserver | null = null

const rangeSizeElements = new Set<Element>()

function requestRelayout(reason = 'trigger'): void {
	if (rafPending || updateInProgress) return
	rafPending = true
	requestAnimationFrame(() => {
		rafPending = false
		updateInProgress = true
		try {
			const params = new URLSearchParams(window.location.search)
			if (params.has('lx-debug')) {
				console.log(`%c[lx-auto] Relayout (${reason})`, 'color:#3498db;font-weight:bold;')
			}
			window.lx.update()
		} finally {
			updateInProgress = false
		}
	})
}

function scanForRangeSizeElements(root: ParentNode = document.body): void {
	const elements = root.querySelectorAll('*')
	for (const el of elements) {
		if (!(el instanceof HTMLElement)) continue
		const attrs = ['lx-width', 'lx-height', 'lx-w', 'lx-h']
		for (const attr of attrs) {
			if (el.hasAttribute(attr)) {
				const value = el.getAttribute(attr)
				if (value && /\//.test(value)) {
					rangeSizeElements.add(el)
				}
			}
		}
	}
}

function handleWindowResize(): void {
	requestRelayout('resize')
}

function handleRangeSizeChange(entries: ResizeObserverEntry[]): void {
	let shouldUpdate = false
	for (const entry of entries) {
		if (entry.target instanceof HTMLElement) {
			const oldWidth = entry.target.dataset.lxOldWidth
			const oldHeight = entry.target.dataset.lxOldHeight
			const newWidth = String(Math.round(entry.contentRect.width))
			const newHeight = String(Math.round(entry.contentRect.height))

			if (oldWidth !== newWidth || oldHeight !== newHeight) {
				entry.target.dataset.lxOldWidth = newWidth
				entry.target.dataset.lxOldHeight = newHeight
				shouldUpdate = true
			}
		}
	}
	if (shouldUpdate) {
		requestRelayout('range-size')
	}
}

function handleMutations(mutations: MutationRecord[]): void {
	if (updateInProgress) return
	if (rafPending) return

	const params = new URLSearchParams(window.location.search)
	const isDebug = params.has('lx-debug')

	let needsSetup = false
	let needsUpdate = false

	for (const mutation of mutations) {
		if (isDebug) {
			console.log(`%c[lx-auto] Mutation detected: ${mutation.type}`, 'color: #95a5a6;', {
				type: mutation.type,
				target: mutation.target,
				added: mutation.addedNodes,
				attr: mutation.attributeName,
			})
		}

		if (mutation.type === 'childList' && (mutation.addedNodes.length > 0 || mutation.removedNodes.length > 0)) {
			needsUpdate = true

			for (const node of mutation.addedNodes) {
				if (node instanceof Element) {
					if (
						node.hasAttribute &&
						(node.hasAttribute('lx') ||
							node.hasAttribute('lx-left') ||
							node.hasAttribute('lx-right') ||
							node.hasAttribute('lx-top') ||
							node.hasAttribute('lx-bottom') ||
							node.hasAttribute('lx-width') ||
							node.hasAttribute('lx-height') ||
							node.hasAttribute('lx-l') ||
							node.hasAttribute('lx-r') ||
							node.hasAttribute('lx-t') ||
							node.hasAttribute('lx-b') ||
							node.hasAttribute('lx-w') ||
							node.hasAttribute('lx-h'))
					) {
						needsSetup = true
						break
					}
				}
			}
		}

		if (mutation.type === 'characterData') {
			if (isDebug) console.log('%c[lx-auto] CharacterData change identified', 'color: #f1c40f;')
			needsUpdate = true
		}

		if (mutation.type === 'attributes') {
			const attr = mutation.attributeName
			if (attr === undefined || attr === null) continue
			if (attr === 'style' || attr === 'class') continue
			if (attr.startsWith('data-lx-')) {
				needsSetup = true
			}
			if (attr.startsWith('lx-') || attr === 'lx' || attr === 'id') {
				needsSetup = true
			}
		}

		if (needsSetup) break
	}

	if (needsSetup) {
		if (isDebug) {
			console.log('%c[lx-auto] DOM mutation detected, re-running setup()', 'color:#e74c3c;font-weight:bold;')
		}
		window.lx.setup()
	} else if (needsUpdate) {
		requestRelayout('text-content-change')
	}
}

export function initAuto(): void {
	if (typeof window.lx === 'undefined') {
		console.warn('%c[lx-auto] lx not found. Make sure lx.js is loaded first.', 'color:#e74c3c;font-weight:bold;')
		return
	}

	window.addEventListener('resize', handleWindowResize, { passive: true })

	scanForRangeSizeElements()
	if (rangeSizeElements.size > 0) {
		resizeObserver = new ResizeObserver(handleRangeSizeChange)
		for (const el of rangeSizeElements) {
			resizeObserver.observe(el)
		}
	}

	mutationObserver = new MutationObserver(handleMutations)
	mutationObserver.observe(document.body, {
		childList: true,
		subtree: true,
		attributes: true,
		characterData: true,
	})
}

export function destroyAuto(): void {
	window.removeEventListener('resize', handleWindowResize)

	if (resizeObserver) {
		resizeObserver.disconnect()
		resizeObserver = null
	}

	if (mutationObserver) {
		mutationObserver.disconnect()
		mutationObserver = null
	}

	rangeSizeElements.clear()
	rafPending = false
	updateInProgress = false
}

if (typeof window !== 'undefined') {
	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', initAuto)
	} else {
		initAuto()
	}

	window.lxAuto = {
		requestRelayout: () => requestRelayout(),
		scanForRangeSizeElements: () => scanForRangeSizeElements(),
		destroy: destroyAuto,
	}
}
