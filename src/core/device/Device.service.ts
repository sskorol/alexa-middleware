import { Inject, Injectable } from '@nestjs/common'
import * as _ from 'lodash'
import { Logger } from 'winston'
import { DEVICE_TOPIC_PREFIX, DEVICES_TOPIC, ErrorMessage, STATE_SUFFIX, WINSTON_LOGGER } from '../../utils/Constants'
import { match } from '../../utils/Matcher'
import { substringBetweenTags } from '../../utils/StringUtils'
import { MqttEvent } from '../mqtt'
import { MqttService } from '../mqtt/MqttService'
import { DevicePayload } from './DevicePayload.dto'
import { Device, Property } from './index'
import { StateReport } from './StateReport.dto'

@Injectable()
export class DeviceService {
  @Inject(WINSTON_LOGGER)
  private readonly logger!: Logger

  private readonly devices: Device[] = []
  private readonly stateReports: StateReport[] = []

  constructor(private readonly mqttService: MqttService) {
    this.mqttService.client.on(MqttEvent.MESSAGE, (topic: string, payload: Buffer) => this.filterTopic(topic, payload))
  }

  public async notifyDevice(path: string, payload: DevicePayload): Promise<void> {
    return this.mqttService.publish(path, JSON.stringify(payload), { qos: 0, retain: false })
  }

  public get devicesInfo(): Device[] {
    return this.devices
  }

  public get reports(): StateReport[] {
    return this.stateReports
  }

  public getReportProperties(endpointId: string): Property[] {
    return _.flatMap(this.stateReports.filter(report => report.id === endpointId), report => report.properties)
  }

  public clearDevices(): void {
    this.devices.length = 0
  }

  private addDevice(payload: Buffer): void {
    if (payload.length === 0) {
      this.logger.error(ErrorMessage.EMPTY_DEVICE_PAYLOAD)
      return
    }

    try {
      const device: Device = JSON.parse(payload.toString())
      const matchingDevice: Device | undefined = this.devices.find(
        d => d.endpointId === device.endpointId || d.friendlyName === device.friendlyName
      )

      if (!matchingDevice) {
        this.devices.push(device)
      }
    } catch (error) {
      this.logger.error(ErrorMessage.INVALID_DEVICE_PAYLOAD, error.toString())
    }
  }

  private addReport(endpointId: string, payload: Buffer): void {
    const properties: Property[] = this.adjustPropertiesTimestamp(payload)
    if (properties.length === 0) {
      this.logger.error(ErrorMessage.MISSING_PROPERTIES)
      return
    }

    const stateReport: StateReport | undefined = this.stateReports.find(report => report.id === endpointId)
    if (!stateReport) {
      this.stateReports.push(new StateReport(endpointId, properties))
    } else {
      stateReport.properties = properties
    }
  }

  private adjustPropertiesTimestamp(payload: Buffer): Property[] {
    const properties: Property[] = []

    if (payload.length !== 0) {
      try {
        const data: object = JSON.parse(payload.toString())
        if (_.isArray(data)) {
          properties.push(
            ...(data as Property[]).map(property => {
              property.timeOfSample = new Date().toJSON()
              return property
            })
          )
        }
      } catch (error) {
        this.logger.error(ErrorMessage.INVALID_PROPERTIES_PAYLOAD, error.toString())
      }
    }

    return properties
  }

  private filterTopic(topic: string, payload: Buffer): void {
    match(topic)
      .on(t => t === DEVICES_TOPIC, () => this.addDevice(payload))
      .on(
        t => t.startsWith(DEVICE_TOPIC_PREFIX) && t.endsWith(STATE_SUFFIX),
        t => this.addReport(substringBetweenTags(t, DEVICE_TOPIC_PREFIX, STATE_SUFFIX), payload)
      )
      .otherwise(() => this.logger.info('[MQTT] [%s]: %s', topic, payload))
  }
}
