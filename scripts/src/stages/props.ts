/**
 * Remove all JSX attributes whose names match the given pattern, including
 * their values. Uses brace-depth scanning so values containing nested braces
 * (e.g. `rn:onPress={lambda: fn()}`) are consumed fully rather than stopping
 * at the first `}`.
 */
export function stripMatchingJsxAttributes(block: string, namePattern: RegExp): string {
  const attributeRegex = new RegExp(
    `(\\s+)(${namePattern.source})(=(?:"[^"]*"|'[^']*'|\\{))?`,
    'g'
  )

  let output    = ''
  let scanIndex = 0

  while (scanIndex < block.length) {
    attributeRegex.lastIndex = scanIndex
    const match = attributeRegex.exec(block)

    if (!match) {
      output += block.slice(scanIndex)
      break
    }

    // Append everything before this attribute
    output += block.slice(scanIndex, match.index)

    if (match[3]?.endsWith('{')) {
      // The value is a JSX expression — scan forward using brace depth
      // to consume the entire {…} value including any nested braces
      let scanPosition = match.index + match[0].length
      let braceDepth   = 1

      while (scanPosition < block.length && braceDepth > 0) {
        if      (block[scanPosition] === '{') braceDepth++
        else if (block[scanPosition] === '}') braceDepth--
        scanPosition++
      }

      scanIndex = scanPosition

    } else {
      // String value or boolean attribute — the regex already consumed it
      scanIndex = match.index + match[0].length
    }
  }

  return output
}


/**
 * Transform platform-specific `rn:` prefixed props in JSX blocks.
 *
 * native target:
 *   rn:onPress={…}  →  onPress={…}   (prefix stripped, prop kept)
 *
 * web target:
 *   rn:onPress={…}  →  (removed entirely)
 *
 * Non-prefixed props like onClick, onChange, className are passed through
 * unchanged on both targets. The html/ wrapper components handle translating
 * web event names to their React Native equivalents at runtime.
 */
export function transformPlatformSpecificProps(blocks: string[], target: string): string[] {
  return blocks.map(block => {
    if (target === 'native') {
      return block.replace(/\brn:(\w+)/g, '$1')
    } else {
      return stripMatchingJsxAttributes(block, /rn:\w+/)
    }
  })
}
