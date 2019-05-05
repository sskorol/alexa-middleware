export interface Device {
  description: string
  displayCategories: string[]
  endpointId: string
  friendlyName: string
  manufacturerName: string
  deviceCapabilities: DeviceCapability[]
}

export interface DeviceCapability {
  type: string
  interface: string
  version: string
  properties: string[]
}

export interface Property {
  namespace: string
  name: string
  timeOfSample: string
  uncertaintyInMilliseconds: number
  value: Value | string
}

export interface Value {
  value: string | number
  scale?: string
}
