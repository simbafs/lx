interface InitOptions {
	debug?: boolean
}

interface Window {
	lx: {
		setup: (root?: ParentNode, options?: InitOptions) => void
		update: () => void
	}
	lxAuto: {
		requestRelayout: (reason?: string) => void
		scanForRangeSizeElements: (root?: ParentNode) => void
		destroy: () => void
	}
}
