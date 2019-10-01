import * as dotenv from 'dotenv'
import * as mqtt from 'mqtt'
import { ConnectionStatus } from '../core/index'

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
  will: {
    topic: STATUS_TOPIC,
    payload: ConnectionStatus.OFFLINE,
    qos: 0,
    retain: true
  }
}
export const SERVER_KEY: string = `${__dirname}/../tls/server_key.pem`
export const SERVER_CERT: string = `${__dirname}/../tls/server_cert.pem`
