/**
 * Strip Transcrypt-generated boilerplate from compiled JS output.
 * Transcrypt adds several things we don't want in the final .jsx file.
 */
export function stripTranscryptBoilerplate(js: string): string {
  return js
    // Header comment: "// Transcrypt'ed from Python, ..."
    .replace(/^\/\/\s*Transcrypt.*?\n/gm, '')
    // Runtime import (org.transcrypt.__runtime__.js) — not available in RN/Next.js
    .replace(/^import\s*\{[^}]+\}\s*from\s*['"][^'"]*__runtime__[^'"]*['"];\s*\n/gm, '')
    // Source map reference
    .replace(/^\/\/# sourceMappingURL=.*\n?/gm, '')
    // 'use strict'; lines (we don't need these in JSX modules)
    .replace(/^\s*'use strict';\s*\n/gm, '')
    // var __name__ = '...'; lines (Transcrypt module metadata)
    .replace(/^\s*var __name__\s*=.*?;\s*\n/gm, '')
    // Transcrypt emits `export var Foo = function` — strip the `export`
    // since we append our own explicit export directive
    .replace(/^export (var \w+)/gm, '$1')
    .trim()
}

/**
 * Re-inject JSX blocks back into the compiled JS.
 * Replaces '__PYX_JSX_N__' string placeholders with the original JSX content.
 */
export function reinjectJsx(js: string, blocks: string[]): string {
  return js.replace(/['"]__PYX_JSX_(\d+)__['"]/g, (_, idxStr) => {
    const idx = parseInt(idxStr, 10)
    return `(\n${blocks[idx].trim()}\n)`
  })
}
