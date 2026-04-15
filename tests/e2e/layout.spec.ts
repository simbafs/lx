import { test, expect } from '@playwright/test'

test.use({ viewport: { width: 1920, height: 1080 } })

test.describe('Layout positioning', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/test.html')
		await page.waitForFunction(() => (window as any).lx !== undefined)
	})

	test('should position #main with correct width based on scale', async ({ page }) => {
		const main = page.locator('#main')
		const box = await main.boundingBox()

		expect(box).not.toBeNull()
		expect(box!.width).toBeCloseTo(1536, 0)
		expect(box!.height).toBeCloseTo(864, 0)
	})

	test('should position #info with fixed dimensions', async ({ page }) => {
		const info = page.locator('#info')
		const box = await info.boundingBox()

		expect(box).not.toBeNull()
		expect(box!.height).toBeCloseTo(200, 0)
		expect(box!.width).toBeGreaterThan(200)
	})

	test('should position #qa below #info with gap', async ({ page }) => {
		const info = page.locator('#info')
		const qa = page.locator('#qa')

		const infoBox = await info.boundingBox()
		const qaBox = await qa.boundingBox()

		expect(infoBox).not.toBeNull()
		expect(qaBox).not.toBeNull()
		expect(qaBox!.y).toBeCloseTo(infoBox!.y + infoBox!.height + 25, 0)
	})

	test('should position #logo below #qa with gap', async ({ page }) => {
		const qa = page.locator('#qa')
		const logo = page.locator('#logo')

		const qaBox = await qa.boundingBox()
		const logoBox = await logo.boundingBox()

		expect(qaBox).not.toBeNull()
		expect(logoBox).not.toBeNull()
		expect(logoBox!.y).toBeCloseTo(qaBox!.y + qaBox!.height + 25, 0)
	})

	test('should position #logo with bottom touching container', async ({ page }) => {
		const sidebar = page.locator('#sidebar')
		const logo = page.locator('#logo')

		const sidebarBox = await sidebar.boundingBox()
		const logoBox = await logo.boundingBox()

		expect(sidebarBox).not.toBeNull()
		expect(logoBox).not.toBeNull()
		expect(Math.abs(logoBox!.y + logoBox!.height - (sidebarBox!.y + sidebarBox!.height))).toBeLessThanOrEqual(2)
	})
})

test.describe('Dynamic updates', () => {
	test('should update layout when gap changes', async ({ page }) => {
		await page.goto('/test.html')
		await page.waitForFunction(() => (window as any).lx !== undefined)

		const qaBefore = await page.locator('#qa').boundingBox()
		const logoBefore = await page.locator('#logo').boundingBox()

		await page.evaluate(() => {
			document.body.setAttribute('data-lx-gap', '50')
			;(window as any).lx.update()
		})

		await page.waitForTimeout(100)

		const qaAfter = await page.locator('#qa').boundingBox()
		const logoAfter = await page.locator('#logo').boundingBox()

		expect(qaAfter!.y).toBeGreaterThan(qaBefore!.y)
		expect(logoAfter!.y).toBeGreaterThan(logoBefore!.y)
	})

	test('should update layout when scale changes', async ({ page }) => {
		await page.goto('/test.html')
		await page.waitForFunction(() => (window as any).lx !== undefined)

		const mainBefore = await page.locator('#main').boundingBox()

		await page.evaluate(() => {
			document.body.setAttribute('data-lx-scale', '0.5')
			;(window as any).lx.update()
		})

		await page.waitForTimeout(100)

		const mainAfter = await page.locator('#main').boundingBox()

		expect(mainAfter!.width).toBeLessThan(mainBefore!.width)
		expect(mainAfter!.height).toBeLessThan(mainBefore!.height)
	})

	test('should update #qa position when #info height changes on click', async ({ page }) => {
		await page.goto('/test.html')
		await page.waitForFunction(() => (window as any).lx !== undefined)

		const qaBefore = await page.locator('#qa').boundingBox()
		const infoBefore = await page.locator('#info').boundingBox()

		await page.click('#info')

		await page.waitForTimeout(200)

		const qaAfter = await page.locator('#qa').boundingBox()
		const infoAfter = await page.locator('#info').boundingBox()

		if (infoAfter!.height > infoBefore!.height) {
			expect(qaAfter!.y).toBeGreaterThan(qaBefore!.y)
		}
	})
})

test.describe('Error handling', () => {
	test('should handle undefined variable gracefully', async ({ page }) => {
		const errors: string[] = []
		page.on('console', (msg) => {
			if (msg.type() === 'error') {
				errors.push(msg.text())
			}
		})

		await page.goto('/test.html')
		await page.waitForFunction(() => (window as any).lx !== undefined)
		await page.waitForTimeout(100)

		const hasLxError = errors.some((e) => e.includes('[lx]'))
		expect(hasLxError).toBe(false)
	})

	test('should handle circular dependency detection', async ({ page }) => {
		await page.goto('/test.html')
		await page.waitForFunction(() => (window as any).lx !== undefined)

		await page.evaluate(() => {
			const a = document.createElement('div')
			a.id = 'circ-a'
			a.setAttribute('lx', '')
			a.setAttribute('lx-l', '#circ-b.right')
			a.setAttribute('lx-t', '0')
			a.setAttribute('lx-w', '100')
			a.setAttribute('lx-h', '50')
			document.body.appendChild(a)

			const b = document.createElement('div')
			b.id = 'circ-b'
			b.setAttribute('lx', '')
			b.setAttribute('lx-l', '#circ-a.right')
			b.setAttribute('lx-t', '0')
			b.setAttribute('lx-w', '100')
			b.setAttribute('lx-h', '50')
			document.body.appendChild(b)

			try {
				;(window as any).lx.setup()
			} catch (e: any) {
				if (e.message && e.message.includes('Circular dependency')) {
					;(window as any).cycleDetected = true
				}
			}
		})

		const cycleDetected = await page.evaluate(() => (window as any).cycleDetected === true)
		expect(cycleDetected).toBe(true)
	})
})
