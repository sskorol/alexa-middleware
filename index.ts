import * as bodyParser from 'body-parser'
import * as dotenv from 'dotenv'
import * as express from 'express'
import * as HttpStatus from 'http-status-codes'
import * as https from 'https'
import * as _ from 'lodash'
import * as morganBody from 'morgan-body'
import { Property } from './src/core/Device'
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
    const stateReport: StateReport | undefined = mqttClient.reports.find(report => report.getId() === request.params.id)
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
        await mqttClient.publish(`${process.env.DEVICE_TOPIC_PREFIX}/${endpointId}`, JSON.stringify(request.body))
        const properties: Property[] = _.flatMap(
          mqttClient.reports.filter(report => report.getId() === endpointId),
          report => report.getProperties()
        )
        response.status(HttpStatus.OK).send(properties)
      } catch (error) {
        log(`Unable to send message to ${endpointId}: ${error.toString()}`)
        response.status(HttpStatus.INTERNAL_SERVER_ERROR).send({ message: 'Unable to publish message' })
      }
    } else {
      response.status(HttpStatus.BAD_REQUEST).send({ message: 'Invalid endpointId' })
    }
  })

https
  .createServer({ cert: read('./server.cert'), key: read('./server.key') }, middlewareService)
  .listen(+(process.env.MIDDLEWARE_PORT || 3000))
