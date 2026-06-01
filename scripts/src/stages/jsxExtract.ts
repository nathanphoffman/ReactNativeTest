/**
 * The result of extracting <jsx>…</jsx> blocks from a .pyx source file.
 */
export interface JsxExtractionResult {
  /**
   * The Python source with every <jsx>…</jsx> block replaced by a
   * string placeholder: "__PYX_JSX_0__", "__PYX_JSX_1__", etc.
   * This makes the source valid Python that Transcrypt can process.
   */
  source: string

  /**
   * The raw JSX content of each extracted block, indexed by placeholder number.
   * Re-injected into the compiled JS output after Transcrypt runs.
   */
  jsxBlocks: string[]
}


/**
 * Extract all <jsx>…</jsx> blocks from .pyx source, replacing each with a
 * string placeholder that Transcrypt will pass through unchanged.
 *
 * Throws a descriptive error if a <jsx> block is found nested inside
 * another <jsx> block — that is always a mistake.
 */
export function extractJsxBlocks(source: string, sourcePath: string): JsxExtractionResult {
  const jsxBlocks: string[] = []
  const blockPattern = /<jsx>([\s\S]*?)<\/jsx>/g

  // Nesting guard: scan all matches before doing any replacement
  for (const match of source.matchAll(/<jsx>([\s\S]*?)<\/jsx>/g)) {
    if (match[1].includes('<jsx>')) {
      throw new Error(
        `Error in ${sourcePath}: Cannot nest <jsx> inside <jsx>. ` +
        `<jsx> must be on the outside.`
      )
    }
  }

  const processedSource = source.replace(blockPattern, (_, blockContent) => {
    const placeholderIndex = jsxBlocks.length
    jsxBlocks.push(blockContent)
    return `"__PYX_JSX_${placeholderIndex}__"`
  })

  return { source: processedSource, jsxBlocks }
}
