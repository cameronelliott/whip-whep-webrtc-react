import * as esbuild from 'esbuild'

let ctx = await esbuild.context({
  entryPoints: ['index.js'],
  outfile: 'out.js',
  bundle: true,
})

await ctx.watch()
console.log('watching...')