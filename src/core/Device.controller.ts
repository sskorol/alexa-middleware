import { Body, Controller, Delete, Get, Inject, InternalServerErrorException, Param, Post } from '@nestjs/common'
import { Logger } from 'winston'
import { DEVICE_TOPIC_PREFIX, WINSTON_LOGGER } from '../utils/Constants'
import { DevicePayload } from './DevicePayload.dto'
import { Device, Property } from './index'
import { Message } from './Message.dto'
import { MqttClient } from './MqttClient'
import { StateReport } from './StateReport.dto'

@Controller('/devices')
export class DeviceController {
  @Inject()
  private mqttClient!: MqttClient

  @Inject(WINSTON_LOGGER)
  private readonly logger!: Logger

  @Get('/stateReports')
  public getStateReports(): StateReport[] {
    return this.mqttClient.reports
  }

  @Get()
  public getDevices(): Device[] {
    return this.mqttClient.devicesInfo
  }

  @Delete()
  public clearDevices(): Message {
    this.mqttClient.clearDevices()
    return new Message('Cleared devices')
  }

  @Get(':id/state')
  public getDeviceState(@Param('id') endpointId: string): Property[] {
    return this.mqttClient.getReportProperties(endpointId)
  }

  @Post(':id')
  public async executeCommandOnDevice(
    @Param('id') endpointId: string,
    @Body() devicePayload: DevicePayload
  ): Promise<Property[] | Message> {
    try {
      await this.mqttClient.publish(`${DEVICE_TOPIC_PREFIX}/${endpointId}`, JSON.stringify(devicePayload))
    } catch (error) {
      this.logger.error('Unable to send message to %s:\n%s', endpointId, error.toString())
      throw new InternalServerErrorException(`Unable to send message to ${endpointId}`)
    }
    return this.mqttClient.getReportProperties(endpointId)
  }
}
