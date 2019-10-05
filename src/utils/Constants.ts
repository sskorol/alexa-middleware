import { Transport } from '@nestjs/common/enums/transport.enum'
import { MqttOptions } from '@nestjs/common/interfaces/microservices/microservice-configuration.interface'
import * as dotenv from 'dotenv'
import * as mqtt from 'mqtt'
import { ConnectionStatus } from '../core/mqtt/index'

dotenv.config()

export const WINSTON_LOGGER: string = 'winston'
export const DEVICE_TOPIC_PREFIX: string = process.env.DEVICE_TOPIC_PREFIX || ''
export const MIDDLEWARE_PORT: number = +(process.env.MIDDLEWARE_PORT || 5000)
export const DEVICES_TOPIC: string = process.env.DEVICES_TOPIC || ''
export const ROOT_TOPIC: string = process.env.ROOT_TOPIC || ''
export const STATUS_TOPIC: string = process.env.STATUS_TOPIC || ''
export const STATE_SUFFIX: string = 'state'

export const MQTT_OPTIONS: mqtt.IClientOptions = {
  password: process.env.MQTT_PASSWORD || '',
  username: process.env.MQTT_USERNAME || '',
  host: process.env.MQTT_HOST || 'localhost',
  port: +(process.env.MQTT_PORT || 1883),
  will: {
    topic: STATUS_TOPIC,
    payload: ConnectionStatus.OFFLINE,
    qos: 1,
    retain: true
  }
}
export const NEST_MQTT_OPTIONS: MqttOptions = {
  transport: Transport.MQTT,
  options: MQTT_OPTIONS
}

export const SERVER_KEY: string = `${__dirname}/../tls/server_key.pem`
export const SERVER_CERT: string = `${__dirname}/../tls/server_cert.pem`

export enum ErrorMessage {
  EMPTY_DEVICE_PAYLOAD = '[MQTT] Unable to add a new device due to empty payload',
  INVALID_DEVICE_PAYLOAD = '[MQTT] Unable to parse device payload: %s',
  MISSING_PROPERTIES = '[MQTT] Unable to retrieve properties from payload',
  INVALID_PROPERTIES_PAYLOAD = '[MQTT] Unable to parse properties payload: %s',
  UNABLE_TO_SUBSCRIBE_TO_TOPIC = '[MQTT] Unable to subscribe to %s topic: %s',
  UNABLE_TO_PUBLISH_TO_TOPIC = '[MQTT] Unable to publish to %s topic: %s'
}
