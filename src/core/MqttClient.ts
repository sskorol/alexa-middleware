import { Inject, Injectable } from '@nestjs/common'
import { AsyncClient } from 'async-mqtt'
import * as _ from 'lodash'
import * as mqtt from 'mqtt'
import { Logger } from 'winston'
import {
  DEVICE_TOPIC_PREFIX,
  DEVICES_TOPIC,
  MQTT_OPTIONS,
  ROOT_TOPIC,
  STATE_SUFFIX,
  STATUS_TOPIC,
  WINSTON_LOGGER
} from '../utils/Constants'
import { match } from '../utils/Matcher'
import { ConnectionStatus, Device, MqttEvent, Property } from './index'
import { StateReport } from './StateReport.dto'

@Injectable()
export class MqttClient {
  private readonly client: AsyncClient = new AsyncClient(mqtt.connect(MQTT_OPTIONS))
  private readonly devices: Device[] = []
  private readonly stateReports: StateReport[] = []

  @Inject(WINSTON_LOGGER)
  private readonly logger!: Logger

  constructor() {
    this.setup()
  }

  public async subscribe(topic: string): Promise<void> {
    if (topic) {
      await this.client.subscribe(topic)
    }
  }

  public async publish(topic: string, payload: string): Promise<void> {
    if (topic && payload) {
      await this.client.publish(topic, payload)
    }
  }

  public async notifyStatus(status: ConnectionStatus): Promise<mqtt.IPublishPacket> {
    return this.client.publish(STATUS_TOPIC, status, { qos: 0, retain: true })
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
    const device: Device = JSON.parse(payload.toString())
    const matchingDevice: Device | undefined = this.devices.find(
      d => d.endpointId === device.endpointId || d.friendlyName === device.friendlyName
    )
    if (!matchingDevice) {
      this.devices.push(device)
    }
  }

  private addReport(endpointId: string, payload: Buffer): void {
    const properties: Property[] = this.adjustPropertiesTimestamp(JSON.parse(payload.toString()))
    const stateReport: StateReport | undefined = this.stateReports.find(report => report.id === endpointId)
    if (!stateReport) {
      this.stateReports.push(new StateReport(endpointId, properties))
    } else {
      stateReport.properties = properties
    }
  }

  private adjustPropertiesTimestamp(properties: Property[]): Property[] {
    return properties.map(property => {
      property.timeOfSample = new Date().toJSON()
      return property
    })
  }

  private extractEndpointId(topic: string): string {
    return topic.substring(DEVICE_TOPIC_PREFIX.length + 1, topic.lastIndexOf(STATE_SUFFIX) - 1)
  }

  private setup(): MqttClient {
    this.client
      .on(MqttEvent.CONNECT, async () => {
        await this.subscribe(ROOT_TOPIC)
        await this.notifyStatus(ConnectionStatus.ONLINE)
      })
      .on(MqttEvent.MESSAGE, (topic: string, payload: Buffer) => {
        match(topic)
          .on(t => t === DEVICES_TOPIC, () => this.addDevice(payload))
          .on(
            t => t.startsWith(DEVICE_TOPIC_PREFIX) && t.endsWith(STATE_SUFFIX),
            t => this.addReport(this.extractEndpointId(t), payload)
          )
          .otherwise(() => this.logger.info('[MQTT] [%s]: %s', topic, payload))
      })
    return this
  }
}
