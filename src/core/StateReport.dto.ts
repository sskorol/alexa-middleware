import { Property } from './index'

export class StateReport {
  constructor(private readonly endpointId: string, private props: Property[]) {}

  public get id(): string {
    return this.endpointId
  }

  public get properties(): Property[] {
    return this.props
  }

  public set properties(properties: Property[]) {
    this.props = properties
  }
}
