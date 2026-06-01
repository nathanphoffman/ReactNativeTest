import * as fs   from 'fs'
import * as path from 'path'

import { autoCapitalizeHtmlElements }    from '../stages/capitalize'
import { transformPlatformSpecificProps } from '../stages/props'
import { discoverHtmlComponents }        from '../utils/html'
import { componentName, webOutputPath }  from '../utils/paths'
import { BuildTarget }                   from '../utils/types'


/**
 * Build a hand-written .html.jsx source file into a .jsx output component.
 *
 * Applies the same html-element capitalization, import injection, and
 * platform prop transforms that the .pyx pipeline uses — but skips
 * Transcrypt entirely since the source is already JavaScript.
 *
 * Skips the file if a .pyx counterpart exists (pass 1 handles it).
 */
export function buildJsx(jsxPath: string, target: BuildTarget): void {

  // Conflict check: Component.html.jsx vs Component.pyx
  const pyxCounterpart = path.join(path.dirname(jsxPath), componentName(jsxPath) + '.pyx')

  if (fs.existsSync(pyxCounterpart)) {
    console.log(`Skip  ${jsxPath}  (pass 1 handles ${path.basename(pyxCounterpart)})`)
    return
  }

  let source = fs.readFileSync(jsxPath, 'utf8')


  // ── Parse // !next: directives (JS-style, since .html.jsx is not Python) ──

  const nextDirectives: string[] = []
  const linesWithoutDirectives: string[] = []

  for (const line of source.split('\n')) {
    const trimmed = line.trim()

    if (trimmed.startsWith('// !next:')) {
      nextDirectives.push(trimmed.slice('// !next:'.length).trim())
    } else {
      linesWithoutDirectives.push(line)
    }
  }

  source = linesWithoutDirectives.join('\n')


  // ── Strip existing ./html import (will be regenerated) ────────────────────

  source = source.replace(
    /^import\s*\{[^}]*\}\s*from\s*['"]\.\/html['"];?\s*\n?/gm,
    ''
  )


  // ── Auto-capitalize html elements and inject ./html import (native only) ──

  let htmlImportLine: string | null = null

  if (target === 'native') {
    const htmlComponentMap = discoverHtmlComponents(jsxPath)
    const { blocks, importLine } = autoCapitalizeHtmlElements([source], htmlComponentMap, jsxPath)
    source = blocks[0]
    htmlImportLine = importLine
  }


  // ── Transform platform-specific rn: props ─────────────────────────────────

  source = transformPlatformSpecificProps([source], target)[0]


  // ── Insert html import after the last existing import statement ───────────

  if (htmlImportLine) {
    const lines = source.split('\n')
    let lastImportLineIndex = -1

    lines.forEach((line, index) => {
      if (/^import\s/.test(line.trim())) lastImportLineIndex = index
    })

    if (lastImportLineIndex >= 0) {
      lines.splice(lastImportLineIndex + 1, 0, htmlImportLine)
      source = lines.join('\n')
    } else {
      source = htmlImportLine + '\n' + source
    }
  }


  // ── Prepend Next.js directives for web target ─────────────────────────────

  const nextJsPrefix = target === 'web'
    ? nextDirectives.map(directive => `'${directive}';\n`).join('')
    : ''

  const finalOutput = nextJsPrefix + source


  // ── Write output ──────────────────────────────────────────────────────────

  const name = componentName(jsxPath)
  const destinationPath = target === 'web'
    ? webOutputPath(jsxPath)
    : path.join(path.dirname(jsxPath), name + '.jsx')

  fs.writeFileSync(destinationPath, finalOutput)
  console.log(`Built [${target}]  ${jsxPath}  →  ${destinationPath}`)
}
