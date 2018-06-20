import logger from 'winston';
import { v4 as uuid } from 'uuid';
import WebSocket from 'ws';
import DeviceSocket from '../lib/deviceSocket';
import Device, { IDeviceModel } from '../models/device.model';
import config from '../config/config';
import { ITimerModel } from '../models/timer.schema';

type SonoffRequest = {
  [key: string]: any;
};

class SonoffRequestHandler {
  apiKey = uuid();
  device: IDeviceModel = null; // will be set on first message from device (register)

  constructor(readonly connection: WebSocket) {
  }

  /**
   * Handle a device request
   * @param {object} req - Request parameters
   * @return {void}
   */
  handleRequest(req: SonoffRequest) {
    if (req.action) {
      // device want to do something
      this.handleAction(req);
    } else if (this.device && req.sequence) {
      // device is acknowledging an action
      this.handleAck(req);
    } else {
      logger.error('Unable to handle request', req);
    }
  }

  /**
   * Handle a device action
   * @param {object} req - request parameters
   * @return {void}
   */
  handleAction(req: SonoffRequest) {
    const { action } = req;

    logger.info('Handling action', action);

    switch (action) {
      case 'date':
        this.handleDate();
        break;
      case 'register':
        this.handleRegister(req);
        break;
      case 'query':
        this.handleQuery(req);
        break;
      case 'update':
        this.handleUpdate(req);
        break;
      default:
        logger.error('Unknown action', action);
        break;
    }
  }

  /**
   * Handle an message acknowledgement received from the device
   * @param {object} req - request parameters
   * @return {void}
   */
  handleAck(req: SonoffRequest) {
    logger.info('Handling ack', req);
    this.device.getConnection().onAck(req.sequence);
  }

  /**
   * Handle a query request.
   * Currently the only supported query is 'timers'
   * @param {object} req - Request parameters
   */
  handleQuery(req: SonoffRequest) {
    const { params } = req;
    if (params.includes('timers')) {
      this.handleTimersRequest();
    } else {
      logger.warn('Unknown query', req);
      this.respondError();
    }
  }

  handleTimersRequest() {
    const deviceTimers = this.device.get('state.timers');
    const now = new Date();

    const timersFormatted = !Array.isArray(deviceTimers) ? []
      : deviceTimers
        // get only repeat timers or one time future timers
        .filter((timer: ITimerModel) => timer.type === 'repeat' || (new Date(timer.at) > now))
        .map((timer: ITimerModel) => ({
          enabled: Number(timer.enabled), // convert boolean to 0/1
          at: timer.at,
          type: timer.type,
          do: { switch: timer.do.switch },
        }));

    this.respond({
      // if there are no timers, set params to 0
      params: timersFormatted.length === 0 ? 0 : [{ timers: timersFormatted }],
    });
  }

  handleUpdate(req: SonoffRequest) {
    const { params } = req;
    this.device.set({
      version: params.fwVersion,
      state: {
        switch: params.switch,
        startup: params.startup,
        rssi: params.rssi,
      },
    });
    this.device.save()
      .then(() => {
        this.respond();
      })
      .catch(() => {
        this.respondError();
      });

  }

  handleDate() {
    this.respond({
      date: new Date().toISOString(),
    });
  }

  /**
   * Handle register request from the device: finds the device records
   * and sets the active WS connection to it.
   * @precondition: The device must already exist (it must be added through the app first)
   * @param {SonoffRequest} req
   */
  handleRegister(req: SonoffRequest) {
    Device.findOne({ id: req.deviceid }, (err, foundDevice: IDeviceModel) => {
      let device = foundDevice;

      if (foundDevice === null) { // trying to register non existing device
        device = this.onRegisterNonExistingDevice(req);
      }

      device.model = req.model;
      device.version = req.romVersion;
      this.device = device;

      this.device.save().then((saveErr) => {
        // Set device manager to the device document
        this.device.setConnection(new DeviceSocket(this.connection, this.apiKey, this.device));
        logger.info('Registered device', this.device.id);
        this.respond();
      }).catch((saveErr) => {
        logger.error(saveErr);
        this.respondError();
      });
    });
  }

  /**
   * Called by handleRegister when device is not found.
   * Either creates the device (single user mode) or throws an error (multi user mode)
   * @param {SonoffRequest} req
   * @returns {IDeviceModel}
   */
  onRegisterNonExistingDevice(req: SonoffRequest) {
    if (config.MULTI_USER) { // multi user mode
      throw new Error(
        'Cannot register non existing device in Multi User mode. Add the device using the API first.',
      );
    }

    // Single user mode. create the non-existing device automatically
    return <IDeviceModel>new Device({
      name: req.deviceid, // Default name: same as device id
    });
  }

  respond(additionalParams = {}) {
    const resp = Object.assign({
      error: 0,
      apikey: this.apiKey,
      deviceid: this.device.id,
    }, additionalParams);
    logger.info('WS | Responding with:', resp);
    this.connection.send(JSON.stringify(resp));
  }

  /**
   * Send an error message to the device
   */
  respondError() {
    this.respond({ error: 1 });
  }

  /**
   * Called when the device connection is closed
   */
  onClose() {
    if (this.device) {
      this.device.removeConnection();
    }
  }
}

export default SonoffRequestHandler;
