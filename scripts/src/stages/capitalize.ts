import * as path from 'path'

export interface CapitalizeResult {
  blocks: string[]
  /** Import line to inject, or null if no html components were used. */
  importLine: string | null
}

/**
 * Capitalize all lowercase JSX tag names across the given blocks.
 * Tracks which names exist in htmlMap for auto-import generation.
 * Only runs for native target — web keeps lowercase native HTML elements.
 */
export function autoCapitalize(
  blocks: string[],
  htmlMap: Record<string, string>,
  srcPath: string
): CapitalizeResult {
  const used = new Set<string>()

  const updated = blocks.map(block =>
    block.replace(/<(\/?)([a-z][a-z0-9]*)(\s|>|\/>)/g, (_, slash, name, after) => {
      const capitalized = name[0].toUpperCase() + name.slice(1)
      if (name in htmlMap) used.add(htmlMap[name])
      return `<${slash}${capitalized}${after}`
    })
  )

  if (used.size === 0) return { blocks: updated, importLine: null }

  const fromDir = path.dirname(path.resolve(srcPath))
  const htmlDir = path.join(fromDir, 'html')
  let rel = path.relative(fromDir, htmlDir).replace(/\\/g, '/')
  if (!rel.startsWith('.')) rel = './' + rel

  const importLine = `import { ${[...used].sort().join(', ')} } from '${rel}'`
  return { blocks: updated, importLine }
}
