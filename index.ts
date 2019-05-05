import * as bodyParser from 'body-parser'
import * as dotenv from 'dotenv'
import * as express from 'express'
import * as HttpStatus from 'http-status-codes'
import * as https from 'https'
import * as morganBody from 'morgan-body'
import { MqttClient } from './src/core/MqttClient'
import { StateReport } from './src/core/StateReport'
import { read } from './src/utils/FileUtils'
import { log } from './src/utils/Logger'

dotenv.config()

const mqttClient: MqttClient = new MqttClient().setup()
const middlewareService: express.Application = express().use(bodyParser.json())
morganBody(middlewareService)

middlewareService
  .get('/stateReports', (request: express.Request, response: express.Response) => {
    response.status(HttpStatus.OK).send(mqttClient.reports)
  })
  .get('/device/:id/state', (request: express.Request, response: express.Response) => {
    const endpointId: string = request.params.id
    const stateReport: StateReport | undefined = mqttClient.reports.find(report => report.getId() === endpointId)
    response.status(HttpStatus.OK).send(stateReport ? stateReport.getProperties() : [])
  })
  .get('/devices', (request: express.Request, response: express.Response) => {
    response.status(HttpStatus.OK).send(mqttClient.devicesInfo)
  })
  .delete('/devices', (request: express.Request, response: express.Response) => {
    mqttClient.clearDevices()
    response.status(HttpStatus.OK).send({ message: 'Cleared devices' })
  })
  .post('/device/:id', async (request: express.Request, response: express.Response) => {
    const endpointId: string = request.params.id

    if (endpointId) {
      try {
        await mqttClient.publish(
          `${process.env.SINGLE_DEVICE_TOPIC_PREFIX}/${endpointId}`,
          JSON.stringify(request.body)
        )
        response
          .status(HttpStatus.OK)
          .send(
            mqttClient.reports.filter(report => report.getId() === endpointId).map(report => report.getProperties())
          )
      } catch (error) {
        log(`Unable to send message to ${endpointId}: ${error.toString()}`)
        response.status(HttpStatus.INTERNAL_SERVER_ERROR).send({ message: 'Unable to publish message' })
      }
    } else {
      response.status(HttpStatus.BAD_REQUEST).send({ message: 'Invalid endpointId' })
    }
  })
  .post('/discovery', async (request: express.Request, response: express.Response) => {
    try {
      await mqttClient.publish(`${process.env.DISCOVERY_TOPIC}`, JSON.stringify(request.body))
      response.status(HttpStatus.OK).send(mqttClient.devicesInfo)
    } catch (error) {
      log(`Unable to broadcast discovery message: ${error.toString()}`)
      response.status(HttpStatus.INTERNAL_SERVER_ERROR).send({ message: 'Unable to publish message' })
    }
  })

https
  .createServer({ cert: read('./server.cert'), key: read('./server.key') }, middlewareService)
  .listen(+(process.env.MIDDLEWARE_PORT || 3000))
