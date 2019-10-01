import { Module } from '@nestjs/common'
import { DeviceController } from './Device.controller'
import { MqttClient } from './MqttClient'

@Module({
  controllers: [DeviceController],
  providers: [MqttClient]
})
export class DeviceModule {}
