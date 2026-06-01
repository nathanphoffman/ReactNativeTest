#!/usr/bin/env node
/**
 * CLI entry point for the .pyx / .html.jsx build pipeline.
 *
 * Usage:
 *   tsx src/cli.ts                        # build all components, native target
 *   tsx src/cli.ts --target web           # build all, web target
 *   tsx src/cli.ts components/Foo.pyx     # build one file
 *   tsx src/cli.ts components/Bar.html.jsx --target web
 */

import * as fs from 'fs'
import * as path from 'path'
import { buildPyx } from './builders/pyx'
import { buildJsx } from './builders/jsx'

// --- Argument parsing ---
const argv = process.argv.slice(2)
const targetIdx = argv.indexOf('--target')
const target = targetIdx !== -1 ? argv[targetIdx + 1] : 'native'

if (target !== 'native' && target !== 'web') {
  console.error(`Invalid target "${target}". Must be "native" or "web".`)
  process.exit(1)
}

const files = argv.filter((a, i) => !a.startsWith('--') && i !== targetIdx + 1)

// --- Build ---
if (files.length > 0) {
  // Build specific files
  for (const f of files) {
    if (f.endsWith('.html.jsx')) {
      buildJsx(f, target)
    } else {
      buildPyx(f, target)
    }
  }
} else {
  // Scan components/ for all source files
  const componentsRoot = path.join(__dirname, '..', '..', 'components')
  const pyxFiles: string[] = []
  const jsxFiles: string[] = []

  function walk(dir: string): void {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name)
      if (entry.isDirectory()) {
        walk(full)
      } else if (entry.name.endsWith('.pyx')) {
        pyxFiles.push(full)
      } else if (entry.name.endsWith('.html.jsx')) {
        jsxFiles.push(full)
      }
    }
  }

  walk(componentsRoot)

  if (pyxFiles.length === 0 && jsxFiles.length === 0) {
    console.error('No .pyx or .html.jsx files found.')
    process.exit(0)
  }

  // Pass 1: Python sources (.pyx → .jsx via Transcrypt)
  for (const f of pyxFiles) buildPyx(f, target)

  // Pass 2: hand-written JSX sources (.html.jsx → .jsx)
  for (const f of jsxFiles) buildJsx(f, target)
}
