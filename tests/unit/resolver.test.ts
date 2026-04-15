import { describe, it, expect } from 'vitest'
import type { CanonicalNode } from '../../src/types'
import { detectCycles, topologicalSort } from '../../src/resolver'

function createMockNode(id: string, refs: Set<string> = new Set()): CanonicalNode {
	return {
		id,
		el: null as any,
		left: null,
		right: null,
		top: null,
		bottom: null,
		width: null,
		height: null,
		refs,
		resolved: null,
		canonicalAttrs: {},
	}
}

describe('topologicalSort', () => {
	it('should return nodes in dependency order', () => {
		const nodes = new Map<string, CanonicalNode>()
		const a = createMockNode('a', new Set())
		const b = createMockNode('b', new Set(['a']))
		const c = createMockNode('c', new Set(['b']))

		nodes.set('a', a)
		nodes.set('b', b)
		nodes.set('c', c)

		const sorted = topologicalSort(nodes)
		const ids = sorted.map((n) => n.id)

		expect(ids.indexOf('a')).toBeLessThan(ids.indexOf('b'))
		expect(ids.indexOf('b')).toBeLessThan(ids.indexOf('c'))
	})

	it('should handle multiple dependencies', () => {
		const nodes = new Map<string, CanonicalNode>()
		const a = createMockNode('a', new Set())
		const b = createMockNode('b', new Set())
		const c = createMockNode('c', new Set(['a', 'b']))

		nodes.set('a', a)
		nodes.set('b', b)
		nodes.set('c', c)

		const sorted = topologicalSort(nodes)
		const ids = sorted.map((n) => n.id)

		expect(ids.indexOf('a')).toBeLessThan(ids.indexOf('c'))
		expect(ids.indexOf('b')).toBeLessThan(ids.indexOf('c'))
	})

	it('should handle diamond dependencies', () => {
		const nodes = new Map<string, CanonicalNode>()
		const a = createMockNode('a', new Set())
		const b = createMockNode('b', new Set(['a']))
		const c = createMockNode('c', new Set(['a']))
		const d = createMockNode('d', new Set(['b', 'c']))

		nodes.set('a', a)
		nodes.set('b', b)
		nodes.set('c', c)
		nodes.set('d', d)

		const sorted = topologicalSort(nodes)
		const ids = sorted.map((n) => n.id)

		expect(ids.indexOf('a')).toBeLessThan(ids.indexOf('b'))
		expect(ids.indexOf('a')).toBeLessThan(ids.indexOf('c'))
		expect(ids.indexOf('b')).toBeLessThan(ids.indexOf('d'))
		expect(ids.indexOf('c')).toBeLessThan(ids.indexOf('d'))
	})

	it('should handle nodes with no dependencies', () => {
		const nodes = new Map<string, CanonicalNode>()
		const a = createMockNode('a', new Set())
		const b = createMockNode('b', new Set())
		const c = createMockNode('c', new Set(['a']))

		nodes.set('a', a)
		nodes.set('b', b)
		nodes.set('c', c)

		const sorted = topologicalSort(nodes)
		const ids = sorted.map((n) => n.id)

		expect(ids.indexOf('a')).toBeLessThan(ids.indexOf('c'))
		expect(ids).toContain('a')
		expect(ids).toContain('b')
		expect(ids).toContain('c')
	})

	it('should include all nodes in output', () => {
		const nodes = new Map<string, CanonicalNode>()
		nodes.set('x', createMockNode('x', new Set(['y'])))
		nodes.set('y', createMockNode('y', new Set(['z'])))
		nodes.set('z', createMockNode('z', new Set()))

		const sorted = topologicalSort(nodes)
		expect(sorted).toHaveLength(3)
		expect(sorted.map((n) => n.id)).toEqual(['z', 'y', 'x'])
	})
})

describe('detectCycles', () => {
	it('should not throw for acyclic graph', () => {
		const nodes = new Map<string, CanonicalNode>()
		const a = createMockNode('a', new Set())
		const b = createMockNode('b', new Set(['a']))
		const c = createMockNode('c', new Set(['b']))

		nodes.set('a', a)
		nodes.set('b', b)
		nodes.set('c', c)

		expect(() => detectCycles(nodes)).not.toThrow()
	})

	it('should throw for direct self-reference', () => {
		const nodes = new Map<string, CanonicalNode>()
		const a = createMockNode('a', new Set(['a']))

		nodes.set('a', a)

		expect(() => detectCycles(nodes)).toThrow('[lx] Circular dependency detected')
	})

	it('should throw for two-node cycle', () => {
		const nodes = new Map<string, CanonicalNode>()
		const a = createMockNode('a', new Set(['b']))
		const b = createMockNode('b', new Set(['a']))

		nodes.set('a', a)
		nodes.set('b', b)

		expect(() => detectCycles(nodes)).toThrow('[lx] Circular dependency detected')
	})

	it('should throw for three-node cycle', () => {
		const nodes = new Map<string, CanonicalNode>()
		const a = createMockNode('a', new Set(['b']))
		const b = createMockNode('b', new Set(['c']))
		const c = createMockNode('c', new Set(['a']))

		nodes.set('a', a)
		nodes.set('b', b)
		nodes.set('c', c)

		expect(() => detectCycles(nodes)).toThrow('[lx] Circular dependency detected')
	})

	it('should throw for complex cycle', () => {
		const nodes = new Map<string, CanonicalNode>()
		const a = createMockNode('a', new Set(['b']))
		const b = createMockNode('b', new Set(['c', 'd']))
		const c = createMockNode('c', new Set())
		const d = createMockNode('d', new Set(['a']))

		nodes.set('a', a)
		nodes.set('b', b)
		nodes.set('c', c)
		nodes.set('d', d)

		expect(() => detectCycles(nodes)).toThrow('[lx] Circular dependency detected')
	})

	it('should include cycle path in error message', () => {
		const nodes = new Map<string, CanonicalNode>()
		const a = createMockNode('a', new Set(['b']))
		const b = createMockNode('b', new Set(['a']))

		nodes.set('a', a)
		nodes.set('b', b)

		expect(() => detectCycles(nodes)).toThrow('#a -> #b -> #a')
	})
})
