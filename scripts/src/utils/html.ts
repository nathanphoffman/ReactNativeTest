import * as fs from 'fs'
import * as path from 'path'


/**
 * Scan the html/ directory that lives alongside the given source file and
 * return a map of { lowercaseTagName → ComponentName }.
 *
 * Example: { 'div': 'Div', 'button': 'Button', 'h1': 'H1', ... }
 *
 * Returns an empty object if no html/ directory is found.
 */
export function discoverHtmlComponents(sourcePath: string): Record<string, string> {
  const htmlDirectory = path.join(path.dirname(path.resolve(sourcePath)), 'html')

  if (!fs.existsSync(htmlDirectory)) return {}

  const componentMap: Record<string, string> = {}

  for (const filename of fs.readdirSync(htmlDirectory)) {
    const { name: componentStem, ext } = path.parse(filename)
    const isComponentFile = ['.tsx', '.ts', '.jsx', '.js'].includes(ext)
    const isNotIndexFile = componentStem !== 'index'

    if (isComponentFile && isNotIndexFile) {
      componentMap[componentStem.toLowerCase()] = componentStem
    }
  }

  return componentMap
}
