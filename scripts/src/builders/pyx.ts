import * as fs   from 'fs'
import * as path from 'path'

import { parseDirectives }                       from '../stages/directives'
import { extractJsxBlocks }                      from '../stages/jsxExtract'
import { autoCapitalizeHtmlElements }            from '../stages/capitalize'
import { compilePythonExpressionsInJsxBlocks }   from '../stages/expressions'
import { transformPlatformSpecificProps }         from '../stages/props'
import { stripTranscryptBoilerplate,
         reinjectJsxBlocksIntoCompiledJs }        from '../stages/boilerplate'
import { runTranscrypt }                          from '../stages/transcrypt'
import { discoverHtmlComponents }                from '../utils/html'
import { componentName, webOutputPath }          from '../utils/paths'
import { BuildTarget }                           from '../utils/types'


/**
 * Build a .pyx (Python + JSX) source file into a .jsx React component.
 *
 * The pipeline runs in six stages:
 *
 *   1. Parse directives
 *      Strip # !js-import:, @export_default, and # !next: lines from the
 *      Python source and collect them for use in the output file header/footer.
 *
 *   2. Extract JSX blocks
 *      Replace every <jsx>…</jsx> block with a string placeholder so the
 *      remaining Python is valid and Transcrypt can process it cleanly.
 *
 *   2a. Auto-capitalize html elements  [native target only]
 *      Convert lowercase tag names (<div>, <h1>) to their React Native
 *      component equivalents (<Div>, <H1>) and generate the ./html import.
 *
 *   2b. Compile Python expressions in JSX {}
 *      Find every {…} expression inside JSX blocks, run them through
 *      Transcrypt in a batch, and substitute the compiled JS back in.
 *
 *   2c. Transform platform-specific props
 *      For native: strip the rn: prefix (rn:onPress → onPress).
 *      For web:    remove rn: attributes entirely.
 *
 *   3. Run Transcrypt
 *      Compile the clean Python source to JavaScript.
 *
 *   4. Strip boilerplate
 *      Remove Transcrypt's runtime import, header comment, and other noise.
 *
 *   5. Re-inject JSX
 *      Replace the string placeholders with the original JSX block content.
 *
 *   6. Assemble and write
 *      Prepend imports, append the export, write the final .jsx file.
 */
export function buildPyx(
  pyxPath:     string,
  target:      BuildTarget,
  outputPath?: string
): void {
  const sourceContent = fs.readFileSync(pyxPath, 'utf8')


  // ── Stage 1: Parse directives ─────────────────────────────────────────────

  const {
    jsImports,
    jsExport,
    nextDirectives,
    cleanSource,
  } = parseDirectives(sourceContent)


  // ── Stage 2: Extract JSX blocks ───────────────────────────────────────────

  const { source: pythonSource, jsxBlocks } = extractJsxBlocks(cleanSource, pyxPath)

  let processedBlocks = jsxBlocks
  let importStatements = [...jsImports]


  // ── Stage 2a: Auto-capitalize html elements (native only) ─────────────────

  if (target === 'native') {
    const htmlComponentMap = discoverHtmlComponents(pyxPath)
    const { blocks: capitalized, importLine } = autoCapitalizeHtmlElements(
      processedBlocks,
      htmlComponentMap,
      pyxPath
    )

    processedBlocks = capitalized

    if (importLine) {
      importStatements = importStatements.filter(line => !line.includes('./html'))
      importStatements.push(importLine)
    }
  }


  // ── Stage 2b: Compile Python expressions in JSX {} ────────────────────────

  processedBlocks = compilePythonExpressionsInJsxBlocks(processedBlocks, pyxPath)


  // ── Stage 2c: Transform platform-specific props ───────────────────────────

  processedBlocks = transformPlatformSpecificProps(processedBlocks, target)


  // ── Stage 3: Run Transcrypt ───────────────────────────────────────────────

  const name = componentName(pyxPath)
  let compiledJs = runTranscrypt(pythonSource, name)


  // ── Stage 4: Strip boilerplate ────────────────────────────────────────────

  compiledJs = stripTranscryptBoilerplate(compiledJs)


  // ── Stage 5: Re-inject JSX blocks ─────────────────────────────────────────

  compiledJs = reinjectJsxBlocksIntoCompiledJs(compiledJs, processedBlocks)


  // ── Stage 6: Assemble and write ───────────────────────────────────────────

  const nextJsPrefix = target === 'web'
    ? nextDirectives.map(directive => `'${directive}';\n`).join('')
    : ''

  const outputParts = [importStatements.join('\n'), '', compiledJs]
  if (jsExport) outputParts.push('', jsExport)

  const finalOutput = nextJsPrefix + outputParts.join('\n') + '\n'

  const destinationPath = outputPath ?? (
    target === 'web'
      ? webOutputPath(pyxPath)
      : path.join(path.dirname(pyxPath), name + '.jsx')
  )

  fs.writeFileSync(destinationPath, finalOutput)
  console.log(`Built [${target}]  ${pyxPath}  →  ${destinationPath}`)
}
