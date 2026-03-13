export function resolveScope(
  global: boolean | undefined,
  local: boolean | undefined
): 'global' | 'local' {
  if (global !== undefined && local !== undefined) {
    throw new Error('Cannot specify both --global and --local')
  }

  if (global === true && local === true) {
    throw new Error('Cannot specify both --global and --local as true')
  }

  if (global === false && local === false) {
    throw new Error('Must specify either --global or --local as true')
  }

  return local ? 'local' : 'global'
}
