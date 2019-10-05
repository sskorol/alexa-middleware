import { Module } from '@nestjs/common'
import { MqttService } from '../mqtt/MqttService'
import { DeviceController } from './Device.controller'
import { DeviceService } from './Device.service'

@Module({
  controllers: [DeviceController],
  providers: [DeviceService, MqttService]
})
export class DeviceModule {}
