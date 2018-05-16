import logger from 'winston';
import { model } from 'mongoose';
import { v4 as uuid } from 'uuid';
import DeviceSocket from '../lib/deviceSocket';
import { IDeviceModel } from '../models/device.model';
import config from '../config/config';
import WebSocket = require('ws');

const Device = model('Devices');

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
    } else {
      // device is acknowledging an action
      this.handleAck(req);
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
    this.respond({
      params: [
        { timers: this.device.get('state.timers') },
      ],
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
        if (config.MULTI_USER) { // multi user mode
          throw new Error(
            'Cannot register non existing device in Multi User mode. Add the device using the API first.',
          );
        }

        // Single user mode. create the non-existing device automatically
        device = <IDeviceModel>new Device({
          name: req.deviceid, // Default name: same as device id
        });
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

  onClose() {
    if (this.device) {
      this.device.set('status', 'offline');
    }
  }
}

export default SonoffRequestHandler;
