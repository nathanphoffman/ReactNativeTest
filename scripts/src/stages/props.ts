/**
 * Remove JSX attributes whose names match namePattern, including their values.
 * Uses brace-depth scanning so values like {lambda: fn()} are consumed fully.
 */
export function stripAttrs(block: string, namePattern: RegExp): string {
  const attrRe = new RegExp(`(\\s+)(${namePattern.source})(=(?:"[^"]*"|'[^']*'|\\{))?`, 'g')
  let result = ''
  let i = 0

  while (i < block.length) {
    attrRe.lastIndex = i
    const m = attrRe.exec(block)
    if (!m) {
      result += block.slice(i)
      break
    }
    result += block.slice(i, m.index)

    if (m[3]?.endsWith('{')) {
      // Brace-depth scan to consume the full {…} value
      let j = m.index + m[0].length
      let depth = 1
      while (j < block.length && depth > 0) {
        if (block[j] === '{') depth++
        else if (block[j] === '}') depth--
        j++
      }
      i = j
    } else {
      i = m.index + m[0].length
    }
  }
  return result
}

/**
 * Transform platform-specific props in JSX blocks.
 *   native: rn:attr → attr  (strip the prefix, keep the prop)
 *   web:    rn:attr → removed entirely
 */
export function transformProps(blocks: string[], target: string): string[] {
  return blocks.map(block => {
    if (target === 'native') {
      return block.replace(/\brn:(\w+)/g, '$1')
    } else {
      return stripAttrs(block, /rn:\w+/)
    }
  })
}
