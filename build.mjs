import * as esbuild from 'esbuild'

const isWatch = process.argv.includes('--watch')

const buildOptions = {
    entryPoints: ['lx.js', 'lx-auto.js'],
    bundle: false,
    minify: true,
    sourcemap: true,
    outdir: 'dist',
    outExtension: { '.js': '.min.js' },
    format: 'iife',
    target: ['es2020'],
    banner: {
        js: '/* lx - HTML attribute DSL for absolute positioning */',
    },
}

if (isWatch) {
    const ctx = await esbuild.context(buildOptions)
    await ctx.watch()
    console.log('Watching for changes...')
} else {
    await esbuild.build(buildOptions)
    console.log('Build complete: dist/lx.min.js, dist/lx-auto.min.js')
}
