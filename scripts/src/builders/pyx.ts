import * as fs from 'fs'
import * as os from 'os'
import * as path from 'path'
import { spawnSync } from 'child_process'

import { parseDirectives } from '../stages/directives'
import { extractJsxBlocks } from '../stages/jsxExtract'
import { autoCapitalize } from '../stages/capitalize'
import { compileJsxExprs } from '../stages/expressions'
import { transformProps } from '../stages/props'
import { stripTranscryptBoilerplate, reinjectJsx } from '../stages/boilerplate'
import { discoverHtmlComponents } from '../utils/html'
import { componentName, webOutputPath } from '../utils/paths'

/**
 * Build a .pyx (Python + JSX) source file into a .jsx component.
 *
 * Pipeline:
 *   1. Parse directives (# !js-import:, @export_default, # !next:)
 *   2. Extract <jsx>…</jsx> blocks → placeholders
 *   2a. Auto-capitalize html tags + inject ./html import  [native only]
 *   2b. Batch-compile Python expressions in JSX {} through Transcrypt
 *   2c. Transform rn: props
 *   3. Run Transcrypt on the clean Python source
 *   4. Strip Transcrypt boilerplate
 *   5. Re-inject JSX blocks
 *   6. Assemble final file
 */
export function buildPyx(pyxPath: string, target: string, outputPath?: string): void {
  const source = fs.readFileSync(pyxPath, 'utf8')

  // 1. Directives
  const { jsImports, jsExport, nextDirectives, cleanSource } = parseDirectives(source)

  // 2. JSX extraction
  const { source: pySource, blocks: jsxBlocks } = extractJsxBlocks(cleanSource, pyxPath)
  let blocks = jsxBlocks
  let imports = [...jsImports]

  // 2a. Auto-capitalize [native only]
  if (target === 'native') {
    const htmlMap = discoverHtmlComponents(pyxPath)
    const { blocks: capitalized, importLine } = autoCapitalize(blocks, htmlMap, pyxPath)
    blocks = capitalized
    if (importLine) {
      imports = imports.filter(l => !l.includes('./html'))
      imports.push(importLine)
    }
  }

  // 2b. Compile Python expressions in JSX {}
  blocks = compileJsxExprs(blocks, pyxPath)

  // 2c. Platform prop transforms
  blocks = transformProps(blocks, target)

  // 3. Run Transcrypt
  const name = componentName(pyxPath)
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pyx_build_'))
  let js: string

  try {
    const tmpPy = path.join(tmpDir, `${name}.py`)
    fs.writeFileSync(tmpPy, pySource)

    const result = spawnSync(
      'python3',
      ['-m', 'transcrypt', '--nomin', '--esv', '6', `${name}.py`],
      { cwd: tmpDir, encoding: 'utf8' }
    )

    if (result.status !== 0) {
      console.error('Transcrypt stderr:\n', result.stderr)
      console.error('Transcrypt stdout:\n', result.stdout)
      process.exit(1)
    }

    js = fs.readFileSync(path.join(tmpDir, '__target__', `${name}.js`), 'utf8')
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true })
  }

  // 4. Strip boilerplate
  js = stripTranscryptBoilerplate(js)

  // 5. Re-inject JSX
  js = reinjectJsx(js, blocks)

  // 6. Assemble
  const prefix = target === 'web'
    ? nextDirectives.map(d => `'${d}';\n`).join('')
    : ''

  const parts = [imports.join('\n'), '', js]
  if (jsExport) parts.push('', jsExport)
  const output = prefix + parts.join('\n') + '\n'

  const dest = outputPath ?? (
    target === 'web' ? webOutputPath(pyxPath) : path.join(path.dirname(pyxPath), name + '.jsx')
  )

  fs.writeFileSync(dest, output)
  console.log(`Built [${target}]  ${pyxPath}  →  ${dest}`)
}
