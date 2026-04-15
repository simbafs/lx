import * as esbuild from 'esbuild'

const isWatch = process.argv.includes('--watch')

const buildOptions = [
	{
		entryPoints: ['src/index.ts'],
		outfile: 'dist/index.min.js',
		bundle: true,
		minify: true,
		sourcemap: true,
		format: 'iife',
		target: ['es2020'],
		banner: {
			js: '/* lx - HTML attribute DSL for absolute positioning */',
		},
	},
	{
		entryPoints: ['src/auto.ts'],
		outfile: 'dist/auto.min.js',
		bundle: true,
		minify: true,
		sourcemap: true,
		format: 'iife',
		target: ['es2020'],
	},
]

async function build() {
	if (isWatch) {
		const ctx = await Promise.all(buildOptions.map((opts) => esbuild.context(opts)))
		for (const c of ctx) {
			await c.watch()
		}
		console.log('Watching for changes...')
	} else {
		for (const opts of buildOptions) {
			await esbuild.build(opts)
		}
		console.log('Build complete: dist/index.min.js, dist/auto.min.js')
	}
}

build()
