import * as fs from 'fs'
import * as path from 'path'

import { autoCapitalize } from '../stages/capitalize'
import { transformProps } from '../stages/props'
import { discoverHtmlComponents } from '../utils/html'
import { componentName, webOutputPath } from '../utils/paths'

/**
 * Build a hand-written .html.jsx source file into a .jsx output.
 * Applies auto-capitalize, html import injection, and rn: prop transforms.
 * Skips silently if a .pyx counterpart exists (pass 1 handles it).
 */
export function buildJsx(jsxPath: string, target: string): void {
  // Conflict check: Component.html.jsx vs Component.pyx
  const pyxCounterpart = path.join(path.dirname(jsxPath), componentName(jsxPath) + '.pyx')
  if (fs.existsSync(pyxCounterpart)) {
    console.log(`Skip  ${jsxPath}  (pass 1 handles ${path.basename(pyxCounterpart)})`)
    return
  }

  let source = fs.readFileSync(jsxPath, 'utf8')

  // Parse // !next: directives (JS-style comments for .html.jsx)
  const nextDirectives: string[] = []
  const cleanLines: string[] = []
  for (const line of source.split('\n')) {
    const stripped = line.trim()
    if (stripped.startsWith('// !next:')) {
      nextDirectives.push(stripped.slice('// !next:'.length).trim())
    } else {
      cleanLines.push(line)
    }
  }
  source = cleanLines.join('\n')

  // Strip existing ./html import — will be regenerated
  source = source.replace(/^import\s*\{[^}]*\}\s*from\s*['"]\.\/html['"];?\s*\n?/gm, '')

  // Auto-capitalize and inject ./html import [native only]
  let htmlImport: string | null = null
  if (target === 'native') {
    const htmlMap = discoverHtmlComponents(jsxPath)
    const result = autoCapitalize([source], htmlMap, jsxPath)
    source = result.blocks[0]
    htmlImport = result.importLine
  }

  // Transform rn: props
  source = transformProps([source], target)[0]

  // Insert html import after the last existing import line
  if (htmlImport) {
    const lines = source.split('\n')
    let lastImportIdx = -1
    lines.forEach((line, i) => {
      if (/^import\s/.test(line.trim())) lastImportIdx = i
    })
    if (lastImportIdx >= 0) {
      lines.splice(lastImportIdx + 1, 0, htmlImport)
      source = lines.join('\n')
    } else {
      source = htmlImport + '\n' + source
    }
  }

  // Prepend Next.js directives for web target
  const prefix = target === 'web'
    ? nextDirectives.map(d => `'${d}';\n`).join('')
    : ''

  const output = prefix + source

  // Determine output path: Component.html.jsx → Component.jsx
  const name = componentName(jsxPath)
  const dest = target === 'web'
    ? webOutputPath(jsxPath)
    : path.join(path.dirname(jsxPath), name + '.jsx')

  fs.writeFileSync(dest, output)
  console.log(`Built [${target}]  ${jsxPath}  →  ${dest}`)
}
