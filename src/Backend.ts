import { ValidationPipe } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import * as bodyParser from 'body-parser'
import * as helmet from 'helmet'
import { BackendModule } from './Backend.module'
import { MIDDLEWARE_PORT, SERVER_CERT, SERVER_KEY } from './utils/Constants'
import { read } from './utils/FileUtils'

async function bootstrap() {
  await (await NestFactory.create(BackendModule, {
    httpsOptions: {
      key: read(SERVER_KEY),
      cert: read(SERVER_CERT)
    }
  }))
    .setGlobalPrefix('api')
    .useGlobalPipes(
      new ValidationPipe({
        transform: true
      })
    )
    .use(bodyParser.json())
    .use(helmet())
    .listen(MIDDLEWARE_PORT)
}

bootstrap()
