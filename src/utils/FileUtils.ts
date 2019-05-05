import * as fs from 'fs'

export function read(path: string): Buffer {
  return fs.readFileSync(path)
}
