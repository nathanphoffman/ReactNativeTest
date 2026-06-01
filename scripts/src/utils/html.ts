import * as fs from 'fs'
import * as path from 'path'

/** Scan the html/ sibling directory and return { lowercaseName: ComponentName }. */
export function discoverHtmlComponents(srcPath: string): Record<string, string> {
  const htmlDir = path.join(path.dirname(path.resolve(srcPath)), 'html')
  if (!fs.existsSync(htmlDir)) return {}

  const mapping: Record<string, string> = {}
  for (const fname of fs.readdirSync(htmlDir)) {
    const { name: stem, ext } = path.parse(fname)
    if (['.tsx', '.ts', '.jsx', '.js'].includes(ext) && stem !== 'index') {
      mapping[stem.toLowerCase()] = stem
    }
  }
  return mapping
}
