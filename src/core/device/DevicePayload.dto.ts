import { IsNotEmpty } from 'class-validator'

export class DevicePayload {
  @IsNotEmpty()
  public command!: string

  @IsNotEmpty()
  public value!: string | boolean | object
}
