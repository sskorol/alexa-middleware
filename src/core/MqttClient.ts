import { AsyncClient } from 'async-mqtt'
import * as mqtt from 'mqtt'
import { match } from '../utils/Matcher'
import { Device, Property } from './Device'
import { MqttEvent } from './MqttEvent'
import { StateReport } from './StateReport'

export class MqttClient {
  private readonly mqttOptions: mqtt.IClientOptions = {
    password: process.env.MQTT_PASSWORD,
    username: process.env.MQTT_USERNAME
  }
  private readonly devicesTopic: string
  private readonly deviceTopicPrefix: string
  private readonly rootTopic: string
  private readonly stateSuffix: string
  private readonly client: AsyncClient
  private readonly devices: Device[]
  private readonly stateReports: StateReport[]

  constructor() {
    this.rootTopic = process.env.ROOT_TOPIC || ''
    this.devicesTopic = process.env.DEVICES_TOPIC || ''
    this.deviceTopicPrefix = process.env.DEVICE_TOPIC_PREFIX || ''
    this.stateSuffix = 'state'
    this.client = new AsyncClient(mqtt.connect(this.mqttOptions))
    this.devices = []
    this.stateReports = []
  }

  public setup(): MqttClient {
    this.client
      .on(MqttEvent.CONNECT, async () => {
        await this.subscribe(this.rootTopic)
      })
      .on(MqttEvent.MESSAGE, (topic: string, payload: Buffer) => {
        match(topic)
          .on(t => t === this.devicesTopic, () => this.addDevice(payload))
          .on(
            t => t.startsWith(this.deviceTopicPrefix) && t.endsWith(this.stateSuffix),
            t => this.addReport(this.extractEndpointId(t), payload)
          )
          .otherwise(() => console.log(`[MQTT] ${topic} doesn't have any handler yet`))
      })
    return this
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

  public get devicesInfo(): Device[] {
    return this.devices
  }

  public get reports(): StateReport[] {
    return this.stateReports
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
    const stateReport: StateReport | undefined = this.stateReports.find(report => report.getId() === endpointId)
    if (!stateReport) {
      this.stateReports.push(new StateReport(endpointId, properties))
    } else {
      stateReport.setProperties(properties)
    }
  }

  private adjustPropertiesTimestamp(properties: Property[]): Property[] {
    return properties.map(property => {
      property.timeOfSample = new Date().toJSON()
      return property
    })
  }

  private extractEndpointId(topic: string): string {
    return topic.substring(this.deviceTopicPrefix.length + 1, topic.lastIndexOf(this.stateSuffix) - 1)
  }
}
