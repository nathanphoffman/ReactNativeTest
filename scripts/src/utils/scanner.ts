import * as fs   from 'fs'
import * as path from 'path'


export interface SourceFiles {
  /** .pyx files — Python + JSX sources processed by Transcrypt (pass 1) */
  pythonSources: string[]

  /** .html.jsx files — hand-written JSX sources (pass 2) */
  handwrittenJsxSources: string[]
}


/**
 * Recursively walk a directory tree and collect all .pyx and .html.jsx
 * source files, separating them by type for the two-pass build.
 */
export function collectSourceFiles(rootDirectory: string): SourceFiles {
  const pythonSources:       string[] = []
  const handwrittenJsxSources: string[] = []

  function walkDirectory(directory: string): void {
    const entries = fs.readdirSync(directory, { withFileTypes: true })

    for (const entry of entries) {
      const fullPath = path.join(directory, entry.name)

      if (entry.isDirectory()) {
        walkDirectory(fullPath)
      } else if (entry.name.endsWith('.pyx')) {
        pythonSources.push(fullPath)
      } else if (entry.name.endsWith('.html.jsx')) {
        handwrittenJsxSources.push(fullPath)
      }
    }
  }

  walkDirectory(rootDirectory)

  return { pythonSources, handwrittenJsxSources }
}
