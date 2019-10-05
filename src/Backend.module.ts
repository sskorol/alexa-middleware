import { Module } from '@nestjs/common'
import { APP_INTERCEPTOR } from '@nestjs/core'
import { MorganInterceptor, MorganModule } from 'nest-morgan'
import { WinstonModule } from 'nest-winston'
import { format, transports } from 'winston'
import { DeviceModule } from './core/device/Device.module'

@Module({
  imports: [
    MorganModule.forRoot(),
    WinstonModule.forRoot({
      transports: [
        new transports.Console({
          format: format.combine(
            format.timestamp({
              format: 'YYYY-MM-DD HH:mm:ss'
            }),
            format.colorize({ colors: { info: 'blue', error: 'red' } }),
            format.errors({ stack: true }),
            format.splat(),
            format.printf(info => `[${info.timestamp}] [${info.level}]: ${info.message}`)
          )
        })
      ]
    }),
    DeviceModule
  ],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: MorganInterceptor('dev')
    }
  ]
})
export class BackendModule {}
