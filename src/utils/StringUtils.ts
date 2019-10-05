const EMPTY_STRING: string = ''
const INDEX_NOT_FOUND: number = -1

export function substringBetween(str: string, tag: string): string {
  return substringBetweenTags(str, tag, tag)
}

export function substringBetweenTags(str: string, open: string, close: string): string {
  if (!str || !open || !close) {
    return EMPTY_STRING
  }

  const start: number = str.indexOf(open)
  if (start !== INDEX_NOT_FOUND) {
    const end: number = str.indexOf(close, start + open.length)
    if (end !== INDEX_NOT_FOUND) {
      return str.substring(start + open.length, end)
    }
  }

  return EMPTY_STRING
}
