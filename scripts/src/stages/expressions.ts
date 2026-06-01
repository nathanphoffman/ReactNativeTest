import { runTranscryptBatch } from './transcrypt'


interface JsxExpression {
  blockIndex: number
  startOffset: number
  endOffset:   number
  pythonExpr:  string
}


/**
 * Find all top-level {…} expressions in a JSX block using brace-depth tracking.
 * Returns an array of [startOffset, endOffset, expressionContent] tuples.
 *
 * "Top-level" means depth 0 — nested braces inside the expression are
 * counted but do not produce additional entries.
 */
function findTopLevelBraceExpressions(block: string): Array<[number, number, string]> {
  const expressions: Array<[number, number, string]> = []
  let braceDepth = 0
  let expressionStart = -1

  for (let charIndex = 0; charIndex < block.length; charIndex++) {
    const char = block[charIndex]

    if (char === '{') {
      if (braceDepth === 0) expressionStart = charIndex
      braceDepth++

    } else if (char === '}') {
      braceDepth--

      if (braceDepth === 0 && expressionStart !== -1) {
        const content = block.slice(expressionStart + 1, charIndex)
        expressions.push([expressionStart, charIndex + 1, content])
        expressionStart = -1
      }
    }
  }

  return expressions
}


/**
 * Extract the right-hand side of a compiled Transcrypt var assignment,
 * using brace-depth tracking to handle multi-line function bodies correctly.
 *
 * Stops at the first `;` found at brace depth 0, so:
 *   var __pyx_jexpr_0__ = function () { return x; };
 * correctly returns `function () { return x; }` rather than stopping
 * at the `;` inside the function body.
 */
function extractCompiledRightHandSide(transcryptOutput: string, expressionIndex: number): string | null {
  const variableMarker = `var __pyx_jexpr_${expressionIndex}__`
  const markerPosition = transcryptOutput.indexOf(variableMarker)

  if (markerPosition === -1) return null

  const assignmentStart = transcryptOutput.indexOf('=', markerPosition) + 1
  let braceDepth = 0

  for (let charIndex = assignmentStart; charIndex < transcryptOutput.length; charIndex++) {
    const char = transcryptOutput[charIndex]

    if      (char === '{') braceDepth++
    else if (char === '}') braceDepth--
    else if (char === ';' && braceDepth === 0) {
      return transcryptOutput.slice(assignmentStart, charIndex).trim()
    }
  }

  return null
}


/**
 * Batch-compile all Python expressions found inside JSX {} blocks through Transcrypt.
 *
 * Collects every {…} expression across all blocks, wraps them as Python variable
 * assignments in a single temp file, runs one Transcrypt subprocess, then
 * substitutes the compiled JS back into the original block positions.
 *
 * Replacements are applied in reverse offset order per block to preserve
 * string offsets during the substitution loop.
 *
 * Falls back to returning blocks unchanged if the Transcrypt subprocess fails.
 */
export function compilePythonExpressionsInJsxBlocks(
  jsxBlocks: string[],
  sourcePath: string
): string[] {
  // Collect all {…} expressions across all blocks
  const allExpressions: JsxExpression[] = []

  for (let blockIndex = 0; blockIndex < jsxBlocks.length; blockIndex++) {
    const exprsInBlock = findTopLevelBraceExpressions(jsxBlocks[blockIndex])

    for (const [startOffset, endOffset, pythonExpr] of exprsInBlock) {
      allExpressions.push({ blockIndex, startOffset, endOffset, pythonExpr })
    }
  }

  if (allExpressions.length === 0) return jsxBlocks

  // Write one Python assignment per expression: __pyx_jexpr_0__ = <expr>
  const pythonAssignmentLines = allExpressions.map(
    ({ pythonExpr }, index) => `__pyx_jexpr_${index}__ = ${pythonExpr}`
  )

  const transcryptOutput = runTranscryptBatch(
    pythonAssignmentLines,
    '__pyx_jexprs__',
    sourcePath
  )

  if (transcryptOutput === null) return jsxBlocks

  // Extract the compiled JS for each expression
  const compiledExpressions = new Map<number, string>()

  for (let exprIndex = 0; exprIndex < allExpressions.length; exprIndex++) {
    const compiledJs = extractCompiledRightHandSide(transcryptOutput, exprIndex)
    if (compiledJs !== null) {
      compiledExpressions.set(exprIndex, compiledJs)
    }
  }

  // Group expressions by their block index
  const expressionsByBlock = new Map<number, Array<{ exprIndex: number; startOffset: number; endOffset: number }>>()

  allExpressions.forEach(({ blockIndex, startOffset, endOffset }, exprIndex) => {
    if (!expressionsByBlock.has(blockIndex)) {
      expressionsByBlock.set(blockIndex, [])
    }
    expressionsByBlock.get(blockIndex)!.push({ exprIndex, startOffset, endOffset })
  })

  // Apply compiled substitutions back into each block (reverse order to preserve offsets)
  const processedBlocks = [...jsxBlocks]

  for (const [blockIndex, expressions] of expressionsByBlock) {
    let blockContent = processedBlocks[blockIndex]

    const reverseSorted = [...expressions].sort((a, b) => b.startOffset - a.startOffset)

    for (const { exprIndex, startOffset, endOffset } of reverseSorted) {
      const compiledJs = compiledExpressions.get(exprIndex)

      if (compiledJs !== undefined) {
        blockContent = (
          blockContent.slice(0, startOffset) +
          '{' + compiledJs + '}' +
          blockContent.slice(endOffset)
        )
      }
    }

    processedBlocks[blockIndex] = blockContent
  }

  return processedBlocks
}
