/**
 * Strip all boilerplate that Transcrypt adds to its compiled JS output.
 *
 * Transcrypt emits several things we don't want in the final .jsx file:
 *   - A header comment identifying the file as Transcrypt output
 *   - A large runtime import from org.transcrypt.__runtime__.js
 *   - A source map reference comment
 *   - 'use strict'; declarations
 *   - var __name__ = '…'; module metadata lines
 *   - `export` keyword on var declarations (we add our own explicit export)
 */
export function stripTranscryptBoilerplate(compiledJs: string): string {
  return compiledJs
    .replace(/^\/\/\s*Transcrypt.*?\n/gm,                                              '')
    .replace(/^import\s*\{[^}]+\}\s*from\s*['"][^'"]*__runtime__[^'"]*['"];\s*\n/gm,  '')
    .replace(/^\/\/# sourceMappingURL=.*\n?/gm,                                        '')
    .replace(/^\s*'use strict';\s*\n/gm,                                               '')
    .replace(/^\s*var __name__\s*=.*?;\s*\n/gm,                                        '')
    .replace(/^export (var \w+)/gm,                                                    '$1')
    .trim()
}


/**
 * Re-inject the original JSX blocks back into the compiled JS.
 *
 * Replaces every `'__PYX_JSX_N__'` string placeholder (emitted verbatim
 * by Transcrypt since it was just a Python string literal) with the
 * original JSX block content wrapped in parentheses.
 */
export function reinjectJsxBlocksIntoCompiledJs(compiledJs: string, jsxBlocks: string[]): string {
  return compiledJs.replace(/['"]__PYX_JSX_(\d+)__['"]/g, (_, indexString) => {
    const blockIndex = parseInt(indexString, 10)
    return `(\n${jsxBlocks[blockIndex].trim()}\n)`
  })
}
