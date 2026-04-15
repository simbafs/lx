import { describe, it, expect, beforeEach } from 'vitest'
import { JSDOM } from 'jsdom'
import { evaluateMath, resolveValue, getVariable } from '../../src/parser'

describe('evaluateMath', () => {
	let document: Document
	let body: HTMLElement

	beforeEach(() => {
		const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>')
		document = dom.window.document
		;(global as any).document = document
		body = document.body
	})

	it('should handle basic addition', () => {
		expect(evaluateMath('1+2', body)).toBe(3)
	})

	it('should handle subtraction with spaces', () => {
		expect(evaluateMath('10 - 3', body)).toBe(7)
	})

	it('should handle basic multiplication', () => {
		expect(evaluateMath('4*3', body)).toBe(12)
	})

	it('should handle basic division', () => {
		expect(evaluateMath('10/2', body)).toBe(5)
	})

	it('should handle operator precedence (multiply before add)', () => {
		expect(evaluateMath('2+3*4', body)).toBe(14)
	})

	it('should handle operator precedence (divide before add)', () => {
		expect(evaluateMath('20/4+2', body)).toBe(7)
	})

	it('should handle negative numbers', () => {
		expect(evaluateMath('-5+10', body)).toBe(5)
	})

	it('should handle decimal numbers', () => {
		expect(evaluateMath('1.5+2.5', body)).toBe(4)
	})

	it('should throw on division by zero', () => {
		expect(() => evaluateMath('10/0', body)).toThrow('[lx] Division by zero')
	})

	it('should throw on invalid token', () => {
		expect(() => evaluateMath('10%5', body)).toThrow('[lx] Invalid token')
	})

	it('should throw on unexpected operator at start', () => {
		expect(() => evaluateMath('+5', body)).toThrow('[lx] Unexpected operator')
	})

	it('should throw on expression ending with operator', () => {
		expect(() => evaluateMath('5+', body)).toThrow('[lx] Expression ends with operator')
	})

	it('should throw on nested parentheses', () => {
		expect(() => evaluateMath('((5+3))', body)).toThrow('[lx] Nested parentheses are not supported')
	})

	it('should throw on empty expression', () => {
		expect(() => evaluateMath('', body)).toThrow('[lx] Empty expression')
	})
})

describe('resolveValue', () => {
	let document: Document
	let body: HTMLElement
	let child: HTMLElement

	beforeEach(() => {
		const dom = new JSDOM('<!DOCTYPE html><html><body><div id="child"></div></body></html>')
		document = dom.window.document
		;(global as any).document = document
		body = document.body
		child = document.getElementById('child') as HTMLElement
	})

	it('should resolve a plain number', () => {
		expect(resolveValue('42', child)).toBe(42)
	})

	it('should resolve a negative number', () => {
		expect(resolveValue('-10', child)).toBe(-10)
	})

	it('should resolve a decimal number', () => {
		expect(resolveValue('3.14', child)).toBe(3.14)
	})

	it('should resolve a simple math expression', () => {
		expect(resolveValue('(10+5)', child)).toBe(15)
	})

	it('should throw on non-numeric string', () => {
		expect(() => resolveValue('abc', child)).toThrow('[lx] Cannot resolve value')
	})
})

describe('getVariable', () => {
	let document: Document
	let body: HTMLElement
	let parent: HTMLElement
	let child: HTMLElement

	beforeEach(() => {
		const dom = new JSDOM('<!DOCTYPE html><html><body><div id="parent"><div id="child"></div></div></body></html>')
		document = dom.window.document
		;(global as any).document = document
		body = document.body
		parent = document.getElementById('parent') as HTMLElement
		child = document.getElementById('child') as HTMLElement
	})

	it('should get variable from body', () => {
		body.setAttribute('data-lx-gap', '25')
		expect(getVariable(child, 'gap')).toBe(25)
	})

	it('should get variable from parent element (scope bubbling)', () => {
		parent.setAttribute('data-lx-scale', '0.8')
		expect(getVariable(child, 'scale')).toBe(0.8)
	})

	it('should prefer closer parent variable', () => {
		body.setAttribute('data-lx-gap', '10')
		parent.setAttribute('data-lx-gap', '20')
		expect(getVariable(child, 'gap')).toBe(20)
	})

	it('should throw on undefined variable', () => {
		expect(() => getVariable(child, 'unknown')).toThrow('[lx] Undefined variable: unknown')
	})

	it('should throw on non-numeric variable value', () => {
		child.setAttribute('data-lx-bad', 'not-a-number')
		expect(() => getVariable(child, 'bad')).toThrow('[lx] Variable "bad" on')
	})
})
