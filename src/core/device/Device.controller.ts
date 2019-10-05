import { Body, Controller, Delete, Get, Inject, Param, Post } from '@nestjs/common'
import { Logger } from 'winston'
import { DEVICE_TOPIC_PREFIX, WINSTON_LOGGER } from '../../utils/Constants'
import { DeviceService } from './Device.service'
import { DevicePayload } from './DevicePayload.dto'
import { Device, Property } from './index'
import { Message } from './Message.dto'
import { StateReport } from './StateReport.dto'

@Controller('/devices')
export class DeviceController {
  @Inject()
  private deviceService!: DeviceService

  @Inject(WINSTON_LOGGER)
  private readonly logger!: Logger

  @Get('/stateReports')
  public getStateReports(): StateReport[] {
    return this.deviceService.reports
  }

  @Get()
  public getDevices(): Device[] {
    return this.deviceService.devicesInfo
  }

  @Delete()
  public clearDevices(): Message {
    this.deviceService.clearDevices()
    return new Message('Cleared devices')
  }

  @Get(':id/state')
  public getDeviceState(@Param('id') endpointId: string): Property[] {
    return this.deviceService.getReportProperties(endpointId)
  }

  @Post(':id')
  public async executeCommandOnDevice(
    @Param('id') endpointId: string,
    @Body() devicePayload: DevicePayload
  ): Promise<Property[] | Message> {
    await this.deviceService.notifyDevice(`${DEVICE_TOPIC_PREFIX}/${endpointId}`, devicePayload)
    return this.deviceService.getReportProperties(endpointId)
  }
}
