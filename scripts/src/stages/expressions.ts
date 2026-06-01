import * as fs from 'fs'
import * as os from 'os'
import * as path from 'path'
import { spawnSync } from 'child_process'

interface JsxExpr {
  blockIdx: number
  start: number
  end: number
  expr: string
}

/** Find all top-level {…} expressions in a JSX block using brace-depth tracking. */
function findJsxExprs(block: string): Array<[number, number, string]> {
  const results: Array<[number, number, string]> = []
  let depth = 0
  let start = -1

  for (let i = 0; i < block.length; i++) {
    if (block[i] === '{') {
      if (depth === 0) start = i
      depth++
    } else if (block[i] === '}') {
      depth--
      if (depth === 0 && start !== -1) {
        results.push([start, i + 1, block.slice(start + 1, i)])
        start = -1
      }
    }
  }
  return results
}

/**
 * Extract the RHS of a var assignment from Transcrypt output using brace-depth
 * tracking. Handles function bodies correctly (stops at `;` only at depth 0).
 */
function extractRhs(jsOut: string, idx: number): string | null {
  const marker = `var __pyx_jexpr_${idx}__`
  const pos = jsOut.indexOf(marker)
  if (pos === -1) return null

  const eq = jsOut.indexOf('=', pos) + 1
  let depth = 0

  for (let i = eq; i < jsOut.length; i++) {
    const ch = jsOut[i]
    if (ch === '{') depth++
    else if (ch === '}') depth--
    else if (ch === ';' && depth === 0) return jsOut.slice(eq, i).trim()
  }
  return null
}

/**
 * Batch-compile all Python expressions inside JSX {} blocks through Transcrypt.
 * Runs a single Transcrypt subprocess for all expressions in all blocks.
 * Falls back to returning blocks unchanged if Transcrypt fails.
 */
export function compileJsxExprs(blocks: string[], srcPath: string): string[] {
  const candidates: JsxExpr[] = []
  for (let bi = 0; bi < blocks.length; bi++) {
    for (const [start, end, expr] of findJsxExprs(blocks[bi])) {
      candidates.push({ blockIdx: bi, start, end, expr })
    }
  }

  if (candidates.length === 0) return blocks

  const batchLines = candidates.map((c, i) => `__pyx_jexpr_${i}__ = ${c.expr}`)
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pyx_jexpr_'))

  try {
    const tmpPy = path.join(tmpDir, '__pyx_jexprs__.py')
    fs.writeFileSync(tmpPy, batchLines.join('\n'))

    const result = spawnSync(
      'python3',
      ['-m', 'transcrypt', '--nomin', '--esv', '6', '__pyx_jexprs__.py'],
      { cwd: tmpDir, encoding: 'utf8' }
    )

    if (result.status !== 0) {
      console.warn(`Warning: JSX expression compile failed in ${srcPath} — leaving {} unchanged`)
      return blocks
    }

    const jsOut = fs.readFileSync(
      path.join(tmpDir, '__target__', '__pyx_jexprs__.js'),
      'utf8'
    )

    // Extract all compiled RHS values
    const compiled = new Map<number, string>()
    for (let idx = 0; idx < candidates.length; idx++) {
      const rhs = extractRhs(jsOut, idx)
      if (rhs !== null) compiled.set(idx, rhs)
    }

    // Group replacements by block, apply in reverse offset order
    const byBlock = new Map<number, JsxExpr[]>()
    candidates.forEach((c, i) => {
      if (!byBlock.has(c.blockIdx)) byBlock.set(c.blockIdx, [])
      byBlock.get(c.blockIdx)!.push({ ...c, blockIdx: i })
    })

    const result_blocks = [...blocks]
    for (const [bi, exprs] of byBlock) {
      let block = result_blocks[bi]
      const sorted = [...exprs].sort((a, b) => b.start - a.start)
      for (const { blockIdx: idx, start, end } of sorted) {
        const rhs = compiled.get(idx)
        if (rhs !== undefined) {
          block = block.slice(0, start) + '{' + rhs + '}' + block.slice(end)
        }
      }
      result_blocks[bi] = block
    }

    return result_blocks
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true })
  }
}
