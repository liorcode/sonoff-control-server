# Sonoff control server

Used as a replacement server for sonoff devices server. Based on [https://blog.ipsumdomus.com/sonoff-switch-complete-hack-without-firmware-upgrade-1b2d6632c01](this blog post).

##### Note
Works only on old sonoff firmwares (below 1.6), with no SSL certifications validation. See https://github.com/mirko/SonOTA/issues/58.


# API

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
