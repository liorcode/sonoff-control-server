import logger from 'winston';
import { model } from 'mongoose';
import { v4 as uuid } from "uuid";
import DeviceSocket from '../lib/deviceSocket';
import { DeviceModel } from "../models/device.model";

const Device = model('Devices');

class SonoffRequestHandler {
  apiKey = uuid();
  device: DeviceModel = null; // will be set on first message from device (register)

  constructor(readonly connection) {
  }

  /**
   * Handle a device request
   * @param {object} req - Request parameters
   * @return {void}
   */
  handleRequest(req) {
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
  handleAction(req) {
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
  handleAck(req) {
    logger.info('Handling ack', req);
    this.device.getConnection().onAck(req.sequence);
  }

  /**
   * Handle a query request.
   * Currently the only supported query is 'timers'
   * @param {object} req - Request parameters
   */
  handleQuery(req) {
    const { params } = req;
    if (params.includes('timers')) {
      this.handleTimersRequest();
    } else {
      logger.warn('Unknown query', req);
      this.respond();
    }
  }

  handleTimersRequest() {
    this.respond({
      params: [
        { timers: this.device.get('state.timers') },
      ],
    });
  }

  handleUpdate(req) {
    const { params } = req;
    this.device.set({
      version: params.fwVersion,
      state: {
        switch: params.switch,
        startup: params.startup,
        rssi: params.rssi,
      },
    });
    this.device.save();

    this.respond();
  }

  handleDate() {
    this.respond({
      date: new Date().toISOString(),
    });
  }

  handleRegister(req) {
    Device.findOne({ deviceId: req.deviceid }, (err, device: DeviceModel) => {
      if (device !== null) {
        // already exists
        this.device = device;
      } else {
        // doesn't exist. create new
        this.device = new Device({
          deviceId: req.deviceid,
          model: req.model,
          version: req.romVersion,
          manufacturerName: 'Sonoff',
          name: req.deviceid, // initial name
        });
      }

      this.device.save((saveErr) => {
        if (saveErr) {
          logger.error(saveErr);
          return;
        }

        // Set device manager to the device document
        this.device.setConnection(new DeviceSocket(this.connection, this.apiKey, this.device));
        logger.info('Registered device', this.device.id);
        this.respond();
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

  onClose() {
    if (this.device) {
      this.device.set('status', 'offline');
    }
  }
}

export default SonoffRequestHandler;
