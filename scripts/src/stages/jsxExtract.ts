export interface JsxExtractResult {
  /** Python source with <jsx> blocks replaced by "__PYX_JSX_N__" placeholders. */
  source: string
  /** Extracted JSX block contents, indexed by placeholder number. */
  blocks: string[]
}

/**
 * Extract all <jsx>…</jsx> blocks from .pyx source.
 * Replaces each block with a string placeholder Transcrypt can pass through.
 * Throws on nested <jsx> tags (always a mistake).
 */
export function extractJsxBlocks(source: string, srcPath: string): JsxExtractResult {
  const blocks: string[] = []
  const pattern = /<jsx>([\s\S]*?)<\/jsx>/g

  // Nesting guard — check before extracting
  for (const m of source.matchAll(/<jsx>([\s\S]*?)<\/jsx>/g)) {
    if (m[1].includes('<jsx>')) {
      throw new Error(
        `Error in ${srcPath}: Cannot nest <jsx> inside <jsx>. <jsx> must be on the outside.`
      )
    }
  }

  const processed = source.replace(pattern, (_, content) => {
    const idx = blocks.length
    blocks.push(content)
    return `"__PYX_JSX_${idx}__"`
  })

  return { source: processed, blocks }
}
