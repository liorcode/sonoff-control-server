# Sonoff control server

Used as a replacement server for sonoff devices.  
It exports a REST server to control and manage devices, as well as a WebSocket server to communicate with the device.
It supports an optional user authentication, using _Google Sign-In_ so only authenticated users will be able to
control their devices.
   
Based on [this blog post](https://blog.ipsumdomus.com/sonoff-switch-complete-hack-without-firmware-upgrade-1b2d6632c01) and inspired by [simple-sonoff-server](https://github.com/mdopp/simple-sonoff-server).

This project is written in TypeScript and uses [Express framework](https://expressjs.com/). The database server is [MongoDB](https://www.mongodb.com/).
##### Attention
Currently this only works on old sonoff firmwares (below 1.6), with no SSL certifications validation. See https://github.com/mirko/SonOTA/issues/58.


# Configuration
Configuration is done using a [dotenv](https://github.com/motdotla/dotenv) file.   

To start, copy the `.env.example` file to `.env` and change the values to match your server configuration. Note that `SERVER_IP` is sent to the device as it, so it must be accessible by it.  

#### Multi user mode
For multi user support, set `MULTI_USER` to true. It would mean that a valid Google SSO Bearer token must be sent with each request.
You will also need to create a Google app client id, and set it to `GOOGLE_CLIENT_ID`.

[Read More](#user-authentication).

Next, as the device requires an SSL connection, you will need to generate a self-signed SSL certificate.  
Place the generated key and certificate in the "certs" directory and add them to the `.env` configuration file.

# installing and running

Requirements:
  * [Node.js](https://nodejs.org)
  * [MongoDB](https://www.mongodb.com/)

```
# using npm:
npm install 
npm run build
npm run serve

# using yarn:
yarn 
yarn build
yarn serve
```

This will compile the project and start the API and the WebSocket server on the configured ports.  

See [Available Commands](#available-commands) for more running options.

# Pairing
See the pairing section under [this blog post](https://blog.ipsumdomus.com/sonoff-switch-complete-hack-without-firmware-upgrade-1b2d6632c01) or use the setup script from [simple-sonoff-server](https://github.com/mdopp/simple-sonoff-server).

# API

### User authentication

If `MULTI_USER` is set to true in your '.env' file, a Google Sign-in Bearer token must be sent along with any request to the `devices` endpoint.

This will ensure that all the devices you add will be related to your user (by google id), and only you could view and control them. 


See [Google Sign-In](https://developers.google.com/identity/) to learn how to generate a token and a Google app client id.  

Once you have generated a token, send the `id_token` to the server as an Authorization header with each request.   
The header should look like: `Authorization: Bearer ID_TOKEN_HERE`.   


Note that you might have to occasionally generate a new token, as it has a limited expiry time.

### Devices

`GET /devices` - List all the devices  
`POST /devices` - Create new device  
`GET /devices/ID` - Get device by id  
`DELETE /devices/ID` - Delete device by id  
`PATCH /devices/ID` - Modify device attributes

#### Device interface

This is the structure you should expect when doing a GET/POST.  
Note that when doing a PATCH, you can only update the name or the state of the device.

```typescript
interface IDeviceParams {
  id: string; // Device id
  model: string; // Device model
  version: string; // ROM version
  name: string; // Device nickname
  state: {
    switch: 'on' | 'off';
    startup: 'on' | 'off' | 'keep';
    rssi: string; // WiFi signal
    timers: {
      enabled?: boolean;
      type: 'once' | 'repeat';
      at: string; // Timestamp for 'once' or cron format for 'repeat'
      do: { switch: 'on' | 'off' };
    }[]
  };
  user: { // Used only if login is required. Inserted automatically according to the Bearer token
    email: string,
    googleId: string,
  };
}
```

#### Examples

##### Register new device

```
POST /devices
{
  id: '10001f56ff',
  model: 'ITA-GZ1-GL',
  version: '1.5.5',
  name: 'Living room light'
}
```

#### Edit existing device name
```
PATCH /devices/10001f56ff
{
  name: 'Kitchen light'
}
```

#### Turn device on
```
PATCH /devices/10001f56ff
{
  state: { switch: 'on' }
}
```

### Timers

These routes are just helper routes. you can also use the 'devices' api directly, passing an array to the 'timers' property. However, this way is cleaner and easier to add/delete/modify timers.

`GET /devices/ID/timers` - List all the device's timers  
`POST /devices/ID` - Create new timer for the device
`GET /devices/ID/timer/id` - Get device by id  
`DELETE /devices/ID` - Delete device by id  
`PATCH /devices/ID` - Modify device attributes

#### Timer interface

This is the structure you should expect when doing a GET/POST/PATCH.  

```typescript
interface ITimerParams {
  enabled?: boolean;
  type: 'once' | 'repeat';
  at: string; // ISO8601 time for 'once' or cron format for 'repeat'
  do: { switch: 'on' | 'off' };
}
```

#### Examples

##### Add a one time 'on' timer
```
POST /devices/10001f56ff/timers
{
  enabled: true,
  type: 'once',
  at: '2018-10-15T19:11:00.000Z',
  do: { switch: 'on' }
}
```

##### Add a repeat timer
```
POST /devices/10001f56ff/timers
{
  enabled: true,
  type: 'repeat',
  at: '18 0 * * 3 *', // each wedensday at 6:00 pm
  do: { switch: 'on' }
}
```

##### Modify timer time
```
PATCH /devices/10001f56ff/timers/1
{
  at: '2018-10-16T02:11:00.000Z'
}
```

##### Remove a timer
```
DELETE /devices/10001f56ff/timers/1
```

#### Sonoff specific routes

Used solely by the Sonoff device.

`POST /dispatch/device` - Returns the Websocket server details (ip and port) in the format expected by the device. Used by the device when it firsts connects to the server.

# Available commands

Any of the following commands can run by `npm run` or `yarn`.

`build` - Compile typescript source to JS and output to "dist" directory  
`build-watch` - Compile source and rebuild on changes  
`lint` - Lint the code using [TSLint](https://github.com/palantir/tslint)  
`serve` - Start server  
`serve-watch` - Start server and watch for any changes in 'dist' directory  
`start` -  Compiles project and start server, in watch mode  
`test` - Run tests using jest
