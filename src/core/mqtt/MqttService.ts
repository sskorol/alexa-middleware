import { Inject, Injectable } from '@nestjs/common'
import { AsyncClient, IClientPublishOptions } from 'async-mqtt'
import * as mqtt from 'mqtt'
import { Logger } from 'winston'
import { ErrorMessage, MQTT_OPTIONS, ROOT_TOPIC, STATUS_TOPIC, WINSTON_LOGGER } from '../../utils/Constants'
import { ConnectionStatus, MqttEvent } from './index'

@Injectable()
export class MqttService {
  @Inject(WINSTON_LOGGER)
  private readonly logger!: Logger
  private readonly asyncClient: AsyncClient

  constructor() {
    this.asyncClient = new AsyncClient(mqtt.connect(MQTT_OPTIONS)).on(MqttEvent.CONNECT, async () => {
      await this.publish(STATUS_TOPIC, ConnectionStatus.ONLINE, { qos: 1, retain: true })
      await this.subscribe(ROOT_TOPIC)
    })
  }

  public get client(): AsyncClient {
    return this.asyncClient
  }

  public async subscribe(topic: string): Promise<void> {
    try {
      await this.asyncClient.subscribe(topic)
    } catch (error) {
      this.logger.error(ErrorMessage.UNABLE_TO_SUBSCRIBE_TO_TOPIC, topic, error.toString())
    }
  }

  public async publish(
    topic: string,
    payload: Buffer | string,
    options: IClientPublishOptions = { qos: 0, retain: false }
  ): Promise<void> {
    try {
      await this.asyncClient.publish(topic, payload, options)
    } catch (error) {
      this.logger.error(ErrorMessage.UNABLE_TO_PUBLISH_TO_TOPIC, topic, error.toString())
    }
  }
}
