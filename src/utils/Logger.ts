import * as moment from 'moment-timezone'

export function log(data: string): void {
  console.log(
    `[${moment()
      .tz('Europe/Kiev')
      .format()}]: ${data}`
  )
}
