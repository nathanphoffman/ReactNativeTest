export interface ParsedDirectives {
  jsImports: string[]
  jsExport: string
  nextDirectives: string[]
  cleanSource: string
}

/**
 * Parse build directives from .pyx source lines, returning clean Python source
 * with directives stripped out.
 *
 * Handled directives:
 *   # !js-import: import X from 'y'   → collected into jsImports
 *   # !js-export: export default Foo  → sets jsExport
 *   # !next: use client               → collected into nextDirectives
 *   @export_default (decorator)       → looks ahead for `def Name(` → sets jsExport
 */
export function parseDirectives(source: string): ParsedDirectives {
  const jsImports: string[] = []
  let jsExport = ''
  const nextDirectives: string[] = []
  const cleanLines: string[] = []

  const lines = source.split('\n')
  let i = 0
  while (i < lines.length) {
    const stripped = lines[i].trim()

    if (stripped.startsWith('# !js-import:')) {
      jsImports.push(stripped.slice('# !js-import:'.length).trim())
    } else if (stripped.startsWith('# !js-export:')) {
      jsExport = stripped.slice('# !js-export:'.length).trim()
    } else if (stripped.startsWith('# !next:')) {
      nextDirectives.push(stripped.slice('# !next:'.length).trim())
    } else if (stripped === '@export_default') {
      // Look ahead for the `def Name(` line
      let j = i + 1
      while (j < lines.length && !lines[j].trim().startsWith('def ')) j++
      if (j < lines.length) {
        const m = lines[j].match(/\s*def\s+(\w+)\s*\(/)
        if (m) jsExport = `export default ${m[1]}`
      }
      // Consume the decorator line — don't emit it
    } else {
      cleanLines.push(lines[i])
    }
    i++
  }

  return { jsImports, jsExport, nextDirectives, cleanSource: cleanLines.join('\n') }
}
