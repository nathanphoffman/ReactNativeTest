/**
 * The result of parsing all build directives from a .pyx source file.
 * Directives are special comment lines that control JS output but are
 * not valid Python — they are stripped before Transcrypt runs.
 */
export interface ParsedDirectives {
  /** JS import statements to emit at the top of the output file. */
  jsImports: string[]

  /** JS export statement to append at the bottom (e.g. "export default Foo"). */
  jsExport: string

  /**
   * Next.js-specific directives (e.g. "use client").
   * Only emitted in web target output.
   */
  nextDirectives: string[]

  /** The Python source with all directive lines removed. */
  cleanSource: string
}


/**
 * Parse and strip all build directives from a .pyx source string.
 *
 * Handled directive forms:
 *
 *   # !js-import: import X from 'y'    Adds an import to the JS output header
 *   # !js-export: export default Foo   Sets the JS export footer
 *   # !next: use client                Collected for Next.js 'use client' etc.
 *   @export_default (decorator)        Looks ahead for `def Name(` and sets jsExport
 */
export function parseDirectives(source: string): ParsedDirectives {
  const jsImports:      string[] = []
  const nextDirectives: string[] = []
  const cleanLines:     string[] = []
  let jsExport = ''

  const lines = source.split('\n')
  let lineIndex = 0

  while (lineIndex < lines.length) {
    const trimmedLine = lines[lineIndex].trim()

    if (trimmedLine.startsWith('# !js-import:')) {
      jsImports.push(trimmedLine.slice('# !js-import:'.length).trim())

    } else if (trimmedLine.startsWith('# !js-export:')) {
      jsExport = trimmedLine.slice('# !js-export:'.length).trim()

    } else if (trimmedLine.startsWith('# !next:')) {
      nextDirectives.push(trimmedLine.slice('# !next:'.length).trim())

    } else if (trimmedLine === '@export_default') {
      // Look ahead to find the `def ComponentName(` line that follows
      let lookAheadIndex = lineIndex + 1
      while (lookAheadIndex < lines.length && !lines[lookAheadIndex].trim().startsWith('def ')) {
        lookAheadIndex++
      }

      if (lookAheadIndex < lines.length) {
        const defMatch = lines[lookAheadIndex].match(/\s*def\s+(\w+)\s*\(/)
        if (defMatch) {
          jsExport = `export default ${defMatch[1]}`
        }
      }

      // Decorator line is consumed — do not emit it to cleanLines

    } else {
      cleanLines.push(lines[lineIndex])
    }

    lineIndex++
  }

  return {
    jsImports,
    jsExport,
    nextDirectives,
    cleanSource: cleanLines.join('\n'),
  }
}
