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

To start, copy the `.env.example` file to `.env` and change the values to match your server configuration. 


#### Multi user mode
For multi user support, set `MULTI_USER` to true. It would mean that a valid Google SSO Bearer token must be sent with each request.
You will also need to create a Google app client id, and set it to `GOOGLE_CLIENT_ID`.

[Read More](#user-authentication).

### SSL Certificate

Next, as the device requires an SSL connection, you will need to generate an SSL certificate.  
You can generate a self-signed one easily using openssl. For example, this will generate a key for 1 year, with no passphrase protection:
```
openssl req -x509  -nodes -newkey rsa:4096 -keyout server.key -out server.cert -days 365
```
Add the file paths to the `.env` configuration file.  

Alternatively, if you don't need node to run on HTTPS (e.g: you are using a proxy or a load balancer for HTTPS instead), you can change the scheme to HTTP by modifying the `SERVER_SCHEME` value. 

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

This step must happen after the [config](#configuration) and [install](#installing-and-running) steps.

For automatic pairing, you need to install the "wifi-control" package:  
`npm install wifi-control`  
(it is intentionally not included by package.json, as it's not always needed)

1. Set device in pairing mode by long-pressing the button in your sonoff device.
2. Run the pairing script: `node pair-device.cli --ssid YOUR_SSID --password --YOUR_WIFI_PASSWORD`
3. Your device will now connect to your WiFi network and your server (it will automatically retry if server is down)

If you are having trouble, try the manual pairing method explained in [this blog post](https://blog.ipsumdomus.com/sonoff-switch-complete-hack-without-firmware-upgrade-1b2d6632c01).  

Note that in [Multi User mode](#multi-user-mode), you will have to add add the device before it will be able to connect to your server. You can do that by a POST request to /devices, with the device id you found in the pairing process. See [Register new device](#register-new-device).

# API

### User authentication

If `MULTI_USER` is set to true in your '.env' file, a Google Sign-in Bearer token must be sent along with any request to the `devices` endpoint.

This will ensure that all the devices you add will be related to your user (by google id), and only you could view and control them. 


See [Google Sign-In](https://developers.google.com/identity/) to learn how to generate a token and a Google app client id.  

Once you have generated a token, send the `id_token` to the server as an Authorization header with each request.   
The header should look like: `Authorization: Bearer ID_TOKEN_HERE`.   


Note that you might have to occasionally generate a new token, as it has a limited expiry time.

To verify you are using a valid token, you can make a GET request to `/users/me`.
The server should reply with your Google ID and email.

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

The cron format is composed of 5 fields, which look like this:  
<Minute> <Hour> <Day_of_the_Month> <Month_of_the_Year> <Day_of_the_Week>  
Notes:
* It seems the "Day of month" and "Month of year" fields must be "*".
* "Day of the Week" is zero-based and can be comma separated to mention several days (2,3 for Tuesday and Wedensday)
* Time zone is UTC
```
POST /devices/10001f56ff/timers
{
  enabled: true,
  type: 'repeat',
  at: '18 0 * * 3', // every wedensday at 6:00 pm
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
`start` -  Builds the project, then serves it (build+serve scripts)   
`test` - Run tests using jest  
`watch` -  Compiles project and start server, in watch mode    


# Alexa Skill
An [Alexa Skill](https://github.com/liorcode/sonoff-control-server-alexa-skill) is available to control this server.
