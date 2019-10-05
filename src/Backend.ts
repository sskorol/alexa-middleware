import { INestApplication, ValidationPipe } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import * as bodyParser from 'body-parser'
import * as helmet from 'helmet'
import { BackendModule } from './Backend.module'
import { MIDDLEWARE_PORT, NEST_MQTT_OPTIONS, SERVER_CERT, SERVER_KEY } from './utils/Constants'
import { read } from './utils/FileUtils'

async function bootstrap() {
  const restModule: INestApplication = await NestFactory.create(BackendModule, {
    httpsOptions: {
      key: read(SERVER_KEY),
      cert: read(SERVER_CERT)
    }
  })
  restModule.connectMicroservice(NEST_MQTT_OPTIONS)

  await restModule
    .setGlobalPrefix('api')
    .useGlobalPipes(
      new ValidationPipe({
        transform: true
      })
    )
    .use(bodyParser.json())
    .use(helmet())
    .startAllMicroservices()
    .listen(MIDDLEWARE_PORT)
}

bootstrap()
