import { Property } from './Device'

export class StateReport {
  private readonly endpointId: string
  private properties: Property[]

  constructor(endpointId: string, properties: Property[]) {
    this.endpointId = endpointId
    this.properties = properties
  }

  public getId(): string {
    return this.endpointId
  }

  public getProperties(): Property[] {
    return this.properties
  }

  public setProperties(properties: Property[]) {
    this.properties = properties
  }
}
