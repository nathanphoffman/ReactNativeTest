import * as fs from 'fs'
import * as path from 'path'

const REPO_ROOT = path.join(__dirname, '..', '..', '..')

/** Extract bare component name from .pyx or .html.jsx source path. */
export function componentName(srcPath: string): string {
  const base = path.basename(srcPath)
  if (base.endsWith('.html.jsx')) return base.slice(0, -'.html.jsx'.length)
  return path.basename(srcPath, path.extname(srcPath))
}

/** Derive web output path: web/app/components/<Name>.jsx from repo root. */
export function webOutputPath(srcPath: string): string {
  const outDir = path.join(REPO_ROOT, 'web', 'app', 'components')
  fs.mkdirSync(outDir, { recursive: true })
  return path.join(outDir, componentName(srcPath) + '.jsx')
}
