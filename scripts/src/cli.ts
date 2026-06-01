#!/usr/bin/env node
/**
 * CLI entry point for the .pyx / .html.jsx component build pipeline.
 *
 * Usage:
 *   tsx src/cli.ts                             Build all components, native target
 *   tsx src/cli.ts --target web                Build all components, web target
 *   tsx src/cli.ts components/Foo.pyx          Build one .pyx file
 *   tsx src/cli.ts components/Bar.html.jsx     Build one .html.jsx file
 *   tsx src/cli.ts [file] --target web         Build one file for web target
 */

import * as path from 'path'
import { buildPyx }            from './builders/pyx'
import { buildJsx }            from './builders/jsx'
import { collectSourceFiles }  from './utils/scanner'
import { BuildTarget }         from './utils/types'


// ── Parse arguments ──────────────────────────────────────────────────────────

const argv = process.argv.slice(2)

const targetFlagIndex = argv.indexOf('--target')
const target          = (targetFlagIndex !== -1 ? argv[targetFlagIndex + 1] : 'native') as BuildTarget

if (target !== 'native' && target !== 'web') {
  console.error(`Invalid --target "${target}". Must be "native" or "web".`)
  process.exit(1)
}

// Everything that isn't a flag or the value after --target is a file path
const explicitFiles = argv.filter(
  (arg, index) => !arg.startsWith('--') && index !== targetFlagIndex + 1
)


// ── Build ─────────────────────────────────────────────────────────────────────

if (explicitFiles.length > 0) {

  // Build only the files explicitly named on the command line
  for (const filePath of explicitFiles) {
    if (filePath.endsWith('.html.jsx')) {
      buildJsx(filePath, target)
    } else {
      buildPyx(filePath, target)
    }
  }

} else {

  // No files specified — scan components/ and build everything
  const componentsRoot = path.join(__dirname, '..', '..', 'components')
  const { pythonSources, handwrittenJsxSources } = collectSourceFiles(componentsRoot)

  if (pythonSources.length === 0 && handwrittenJsxSources.length === 0) {
    console.error('No .pyx or .html.jsx source files found.')
    process.exit(0)
  }

  // Pass 1: Python sources (.pyx → .jsx via Transcrypt pipeline)
  for (const sourcePath of pythonSources) {
    buildPyx(sourcePath, target)
  }

  // Pass 2: Hand-written JSX sources (.html.jsx → .jsx)
  for (const sourcePath of handwrittenJsxSources) {
    buildJsx(sourcePath, target)
  }

}
