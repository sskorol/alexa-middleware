import * as moment from 'moment-timezone'

const timezone: string = process.env.TIMEZONE || 'Europe/Kiev'

export function log(data: string): void {
  console.log(
    `[${moment()
      .tz(timezone)
      .format()}]: ${data}`
  )
}
