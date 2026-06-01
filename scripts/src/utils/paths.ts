import * as fs from 'fs'
import * as path from 'path'


/** Absolute path to the repository root (two levels up from scripts/src/utils/). */
const REPO_ROOT = path.join(__dirname, '..', '..', '..')


/**
 * Extract the bare component name from a source file path.
 *
 * Examples:
 *   components/Button.pyx      → "Button"
 *   components/Card.html.jsx   → "Card"
 */
export function componentName(sourcePath: string): string {
  const basename = path.basename(sourcePath)

  if (basename.endsWith('.html.jsx')) {
    return basename.slice(0, -'.html.jsx'.length)
  }

  return path.basename(sourcePath, path.extname(sourcePath))
}


/**
 * Derive the Next.js web output path for a source file.
 * Output always lands in web/app/components/<ComponentName>.jsx.
 * Creates the output directory if it does not exist.
 */
export function webOutputPath(sourcePath: string): string {
  const outputDirectory = path.join(REPO_ROOT, 'web', 'app', 'components')

  fs.mkdirSync(outputDirectory, { recursive: true })

  return path.join(outputDirectory, componentName(sourcePath) + '.jsx')
}
