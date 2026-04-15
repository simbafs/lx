import { describe, it, expect, beforeEach } from 'vitest'
import { JSDOM } from 'jsdom'
import type { CanonicalNode } from '../../src/types'
import { expandSugarToCanonical, findNearestLxAncestor } from '../../src/parser'

function createMockNode(id: string): CanonicalNode {
	return {
		id,
		el: null as any,
		left: null,
		right: null,
		top: null,
		bottom: null,
		width: null,
		height: null,
		refs: new Set(),
		resolved: null,
		canonicalAttrs: {},
	}
}

describe('findNearestLxAncestor', () => {
	let document: Document
	let body: HTMLElement
	let container: HTMLElement
	let child: HTMLElement

	beforeEach(() => {
		const dom = new JSDOM(
			'<!DOCTYPE html><html><body><div id="container"><div id="child"></div></div></body></html>',
		)
		document = dom.window.document
		;(global as any).document = document
		body = document.body
		container = document.getElementById('container') as HTMLElement
		child = document.getElementById('child') as HTMLElement
	})

	it('should return body when no ancestor has lx id', () => {
		const containerIds = new Set<string>()
		expect(findNearestLxAncestor(child, containerIds)).toBe('body')
	})

	it('should find the nearest lx ancestor', () => {
		const containerIds = new Set(['container'])
		expect(findNearestLxAncestor(child, containerIds)).toBe('container')
	})

	it('should skip non-lx ancestors', () => {
		const dom = new JSDOM(
			'<!DOCTYPE html><html><body><div id="outer"><div id="inner"><div id="child"></div></div></div></body></html>',
		)
		document = dom.window.document
		;(global as any).document = document

		const outer = document.getElementById('outer') as HTMLElement
		const child = document.getElementById('child') as HTMLElement
		const containerIds = new Set(['outer'])

		expect(findNearestLxAncestor(child, containerIds)).toBe('outer')
	})
})

describe('expandSugarToCanonical - previous/next', () => {
	let document: Document

	beforeEach(() => {
		const dom = new JSDOM(
			`<!DOCTYPE html><html><body>
				<div id="container">
					<div id="first" lx lx-l="0" lx-t="0" lx-w="100" lx-h="50"></div>
					<div id="second" lx lx-l="0" lx-t="0" lx-w="100" lx-h="50"></div>
					<div id="third" lx lx-l="0" lx-t="0" lx-w="100" lx-h="50"></div>
				</div>
			</body></html>`,
		)
		document = dom.window.document
		;(global as any).document = document
	})

	it('should translate previous.top to actual id', () => {
		const container = document.getElementById('container') as HTMLElement
		const containerIds = new Set(['container', 'first', 'second', 'third'])
		const containerOrderedIds = new Map<string, string[]>([
			['container', ['first', 'second', 'third']],
		])
		const nodes = new Map<string, CanonicalNode>([
			['first', createMockNode('first')],
			['second', createMockNode('second')],
			['third', createMockNode('third')],
		])

		const second = document.getElementById('second') as HTMLElement
		second.setAttribute('lx-t', 'previous.top+10')

		const result = expandSugarToCanonical(second, containerIds, containerOrderedIds, nodes)

		expect(result.top?.value).toBe('#first.top+10')
	})

	it('should translate next.bottom to actual id', () => {
		const containerIds = new Set(['container', 'first', 'second', 'third'])
		const containerOrderedIds = new Map<string, string[]>([
			['container', ['first', 'second', 'third']],
		])
		const nodes = new Map<string, CanonicalNode>([
			['first', createMockNode('first')],
			['second', createMockNode('second')],
			['third', createMockNode('third')],
		])

		const first = document.getElementById('first') as HTMLElement
		first.setAttribute('lx-b', 'next.bottom-5')

		const result = expandSugarToCanonical(first, containerIds, containerOrderedIds, nodes)

		expect(result.bottom?.value).toBe('#second.bottom-5')
	})

	it('should throw when first element uses previous', () => {
		const containerIds = new Set(['container', 'first', 'second'])
		const containerOrderedIds = new Map<string, string[]>([['container', ['first', 'second']]])
		const nodes = new Map<string, CanonicalNode>([
			['first', createMockNode('first')],
			['second', createMockNode('second')],
		])

		const first = document.getElementById('first') as HTMLElement
		first.setAttribute('lx-t', 'previous.top')

		expect(() => expandSugarToCanonical(first, containerIds, containerOrderedIds, nodes)).toThrow(
			'first element in container',
		)
	})

	it('should throw when last element uses next', () => {
		const containerIds = new Set(['container', 'first', 'second'])
		const containerOrderedIds = new Map<string, string[]>([['container', ['first', 'second']]])
		const nodes = new Map<string, CanonicalNode>([
			['first', createMockNode('first')],
			['second', createMockNode('second')],
		])

		const second = document.getElementById('second') as HTMLElement
		second.setAttribute('lx-t', 'next.top')

		expect(() => expandSugarToCanonical(second, containerIds, containerOrderedIds, nodes)).toThrow(
			'last element in container',
		)
	})
})

describe('expandSugarToCanonical - scope bubbling', () => {
	let document: Document

	beforeEach(() => {
		const dom = new JSDOM(
			`<!DOCTYPE html><html><body data-lx-gap="25" data-lx-scale="0.8">
				<div id="outer" lx data-lx-inner="100">
					<div id="inner" lx data-lx-inner="200">
						<div id="child"></div>
					</div>
				</div>
			</body></html>`,
		)
		document = dom.window.document
		;(global as any).document = document
	})

	it('should use variable from closest parent', () => {
		const containerIds = new Set(['outer', 'inner'])
		const containerOrderedIds = new Map<string, string[]>([['outer', ['inner']]])
		const nodes = new Map<string, CanonicalNode>([
			['outer', createMockNode('outer')],
			['inner', createMockNode('inner')],
		])

		const inner = document.getElementById('inner') as HTMLElement
		inner.setAttribute('lx-w', '({inner})')

		const result = expandSugarToCanonical(inner, containerIds, containerOrderedIds, nodes)

		expect(result.width?.value).toBe('200')
	})

	it('should fall back to outer parent variable', () => {
		const containerIds = new Set(['outer', 'inner'])
		const containerOrderedIds = new Map<string, string[]>([['outer', ['inner']]])
		const nodes = new Map<string, CanonicalNode>([
			['outer', createMockNode('outer')],
			['inner', createMockNode('inner')],
		])

		const inner = document.getElementById('inner') as HTMLElement
		inner.setAttribute('lx-w', '({gap})')

		const result = expandSugarToCanonical(inner, containerIds, containerOrderedIds, nodes)

		expect(result.width?.value).toBe('25')
	})

	it('should use body variable when not found in parents', () => {
		const containerIds = new Set(['outer'])
		const containerOrderedIds = new Map<string, string[]>([['outer', ['outer']]])
		const nodes = new Map<string, CanonicalNode>([['outer', createMockNode('outer')]])

		const outer = document.getElementById('outer') as HTMLElement
		outer.setAttribute('lx-w', '({scale})')

		const result = expandSugarToCanonical(outer, containerIds, containerOrderedIds, nodes)

		expect(result.width?.value).toBe('0.8')
	})
})

describe('expandSugarToCanonical - range size', () => {
	let document: Document

	beforeEach(() => {
		const dom = new JSDOM(
			`<!DOCTYPE html><html><body>
				<div id="container">
					<div id="el" lx></div>
				</div>
			</body></html>`,
		)
		document = dom.window.document
		;(global as any).document = document
	})

	it('should parse range size correctly', () => {
		const containerIds = new Set(['container', 'el'])
		const containerOrderedIds = new Map<string, string[]>([['container', ['el']]])
		const nodes = new Map<string, CanonicalNode>([['el', createMockNode('el')]])

		const el = document.getElementById('el') as HTMLElement
		el.setAttribute('lx-h', '200/500')

		const result = expandSugarToCanonical(el, containerIds, containerOrderedIds, nodes)

		expect(result.height?.value).toBe('200/500')
	})

	it('should parse range with negative values', () => {
		const containerIds = new Set(['container', 'el'])
		const containerOrderedIds = new Map<string, string[]>([['container', ['el']]])
		const nodes = new Map<string, CanonicalNode>([['el', createMockNode('el')]])

		const el = document.getElementById('el') as HTMLElement
		el.setAttribute('lx-w', '-10/100')

		const result = expandSugarToCanonical(el, containerIds, containerOrderedIds, nodes)

		expect(result.width?.value).toBe('-10/100')
	})
})
