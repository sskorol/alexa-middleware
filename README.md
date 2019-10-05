# Alexa Middleware Service

This repository contains a simple implementation of a middleware layer between Alexa and Arduino-like micro-controllers.

See [Alexa Smart Home Skill Template](https://github.com/sskorol/alexa-smart-home-skill-template) for details.

## Installation and Startup

Run the following command to setup required dependencies:

```bash
npm install
``` 

Generate a self-signed certificate via [OpenSSL](https://www.openssl.org/) tool (or just use your own existing certificate).

Put certificates into **./src/core/tls** folder. Names could be configured within **./src/utils/Constants.ts**.

Setup [Mosquitto](https://mosquitto.org/) MQTT broker for routing messages between micro-controllers and middleware layer.

Note that it's recommended to protect your broker with at least basic credentials.

Create **.env** file in the root of the project with the following content:

```dotenv
MIDDLEWARE_PORT=
MQTT_USERNAME=
MQTT_PASSWORD=
ROOT_TOPIC=home/#
DEVICES_TOPIC=home/devices
DEVICE_TOPIC_PREFIX=home/device
STATUS_TOPIC=home/middleware/status
```

Feel free to put your own values here.

Note that by default Middleware layer is configured to listen all the messages from within **ROOT_TOPIC**.

**DEVICES_TOPIC** is used for publishing an extensive information about available devices in you local network. Note that all the messages must follow the json format described in **./src/core/index.ts**.

Basically, all the micro-controllers will use Alexa-compatible messages' format to avoid any additional transformations while interacting with a Smart Home Skill. You can check the following [repository](https://github.com/sskorol/arduino-alexa-bridge) to simplify required configuration stuff.

**DEVICES_TOPIC_PREFIX** is used to access individual device state. It's concatenated with device id (**endpointId**) and **/state** suffix in runtime.

**STATUS_TOPIC** is useful for tracking middleware MQTT client's state via so-called **will** feature. This topic will be notified when a client goes online/offline.  

To start Middleware in a development mode, use the following command:

```bash
npm run start
```

Note that in this mode you'll see all the requests / responses in the console log. Moreover, any code updates will immediately trigger rebuild and restart process. 

To run this Middleware in a production mode (e.g. on Raspberry Pi environment) you may want to setup [pm2](https://pm2.io/doc/en/runtime/overview/?utm_source=pm2&utm_medium=website&utm_campaign=rebranding) tool globally first.

The following command will help to wrap some common startup / shutdown operations:
```bash
npm run start-prod
npm run stop-prod
```

## Endpoints

Use the following endpoints to interact with Alexa Smart Home Skill:  

 - [GET] **/api/devices/stateReports**: returns actual states collected from available devices in your local network.
 - [GET] **/api/devices/:id/state**: returns a state report form requested device.
 - [GET] **/api/devices**: returns all available devices in you local network in Alexa-compatible for discovery format.
 - [DELETE] **/api/devices**: clears an in-memory array of available devices.
 - [POST] **/api/devices/:id**: sends an MQTT command to specified device.
 
## Flow

Let's consider the following scenario: user wants to turn on the light.

Light bubble might be controlled by NodeMCU board via relay or RF transmitter.

If micro-controller sends the following json to **home/devices** topic, Middleware will put it into in-memory storage for further usage by Alexa Smart Home Skill. 

```json
[
  {
    "endpointId": "lobby_lamp_1",
    "friendlyName": "light",
    "description": "Lobby Lamp 1",
    "manufacturerName": "Home",
    "cookie": {},
    "displayCategories": [
      "LIGHT"
    ],
    "capabilities": [
      {
        "type": "AlexaInterface",
        "interface": "Alexa.PowerController",
        "version": "3",
        "properties": {
          "supported": [
            {
              "name": "powerState"
            }
          ],
          "proactivelyReported": true,
          "retrievable": true
        }
      },
      {
        "type": "AlexaInterface",
        "interface": "Alexa",
        "version": "3"
      },
      {
        "type": "AlexaInterface",
        "interface": "Alexa.EndpointHealth",
        "version": "3",
        "properties": {
          "supported": [
            {
              "name": "connectivity"
            }
          ],
          "proactivelyReported": true,
          "retrievable": true
        }
      }
    ]
  }
]
```

When user first activates a skill and run devices' discovery, Smart Home Skill calls [DiscoveryHandler](https://github.com/sskorol/alexa-smart-home-skill-template/blob/development/src/core/DiscoveryHandler.ts), which then requests devices from our Middleware **/api/devices** endpoint.

When user says **Alexa, light on** (assuming the mentioned above friendly name in json), Smart Home Skill calls [PowerHandler](https://github.com/sskorol/alexa-smart-home-skill-template/blob/development/src/core/PowerHandler.ts), which then sends a power control command, e.g.

```json
[
  {
	"command":"TurnOn",
  	"state":true
  }
]
```
 
to our Middleware -> **/api/devices/lobby_lamp_1** endpoint.

This command is published to individual **home/device/lobby_lamp_1** topic, which our NodeMCU board is subscribed to.

Micro-controller parses json message and executes the requested command via relay or RF transmitter. 
