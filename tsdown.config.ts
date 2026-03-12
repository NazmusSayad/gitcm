import { defineConfig } from 'tsdown'
import packageJSON from './package.json' with { type: 'json' }

export default defineConfig({
  entry: {
    index: './src/index.ts',
  },

  format: 'es',
  outDir: './dist',
  tsconfig: './tsconfig.json',

  target: 'ES6',
  minify: 'dce-only',

  treeshake: false,
  external: [/node:/gim, ...getExternal((packageJSON as any).dependencies)],
})

function getExternal(dependencies: unknown) {
  return Object.keys((dependencies ?? {}) as Record<string, string>).map(
    (dep) => new RegExp(`(^${dep}$)|(^${dep}/)`)
  )
}
