import * as path from 'path'


export interface AutoCapitalizeResult {
  /** The JSX blocks with all lowercase tag names capitalized. */
  blocks: string[]

  /**
   * The import line to inject for html wrapper components, or null if
   * no html/ components were used.
   *
   * Example: "import { Button, Div, H1 } from './html'"
   */
  importLine: string | null
}


/**
 * Capitalize all lowercase JSX element names across the given blocks.
 *
 * React Native requires component names to start with an uppercase letter.
 * This transform handles the conversion automatically so authors can write
 * natural lowercase HTML tags (<div>, <h1>, <button>) in .pyx files.
 *
 * Also tracks which capitalized names exist in htmlComponentMap so an
 * auto-import line can be generated for them.
 *
 * Only runs for the native target — web output keeps lowercase HTML elements.
 */
export function autoCapitalizeHtmlElements(
  blocks:             string[],
  htmlComponentMap:   Record<string, string>,
  sourcePath:         string
): AutoCapitalizeResult {
  const usedHtmlComponents = new Set<string>()

  const capitalizedBlocks = blocks.map(block =>
    block.replace(/<(\/?)([a-z][a-z0-9]*)(\s|>|\/>)/g, (_, slash, tagName, trailingChar) => {
      const capitalizedName = tagName[0].toUpperCase() + tagName.slice(1)

      if (tagName in htmlComponentMap) {
        usedHtmlComponents.add(htmlComponentMap[tagName])
      }

      return `<${slash}${capitalizedName}${trailingChar}`
    })
  )

  if (usedHtmlComponents.size === 0) {
    return { blocks: capitalizedBlocks, importLine: null }
  }

  // Build a relative path from the source file's directory to the html/ folder
  const sourceDirectory = path.dirname(path.resolve(sourcePath))
  const htmlDirectory   = path.join(sourceDirectory, 'html')
  let relativeHtmlPath  = path.relative(sourceDirectory, htmlDirectory).replace(/\\/g, '/')

  if (!relativeHtmlPath.startsWith('.')) {
    relativeHtmlPath = './' + relativeHtmlPath
  }

  const sortedComponentNames = [...usedHtmlComponents].sort().join(', ')
  const importLine = `import { ${sortedComponentNames} } from '${relativeHtmlPath}'`

  return { blocks: capitalizedBlocks, importLine }
}
