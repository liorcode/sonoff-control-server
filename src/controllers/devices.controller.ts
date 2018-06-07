import { model } from 'mongoose';
import { NextFunction, Request, Response } from 'express';
import { IDeviceModel, IDeviceParams } from '../models/device.model';
import { pick, merge } from 'lodash';
import config from '../config/config';
import ServerError from '../lib/ServerError';

const Device = model('Devices');

class DevicesController {
  /**
   * Get a list of all the devices of the logged in user
   *
   * @param {http.IncomingMessage} req - Client request
   * @param {http.ServerResponse} response - Response object
   * @param {NextFunction} next - next middleware
   */
  static list(req: Request, response: Response, next: NextFunction): void {
    Device.find({ user: req.user }, (err, list) => {
      if (err) {
        return next(err);
      }
      return response.json(list);
    });
  }

  /**
   * Creates a new device
   *
   * @param {http.IncomingMessage} req - Client request
   * @param {http.ServerResponse} response - Response object
   * @param {NextFunction} next - next middleware
   */
  static create(req: Request, response: Response, next: NextFunction): void {
    const newDevice = new Device({
      ...req.body,
      user: req.user, // must be last, to override 'user' attribute if exists in request
    });
    newDevice.save((err, device) => {
      if (err) {
        return next(err);
      }
      return response.json(device);
    });
  }

  /**
   * Get device by id.
   * Request params must have a 'deviceId' attribute
   *
   * @param {http.IncomingMessage} req - Client request
   * @param {http.ServerResponse} response - Response object
   * @param {NextFunction} next - next middleware
   */
  static getDevice(req: Request, response: Response, next: NextFunction): void {
    Device.findOne({ id: req.params.deviceId, user: req.user }, (err, device) => {
      if (err) {
        return next(err);
      }
      if (!device) {
        return next(new ServerError('Requested device does not exist', 404, req.originalUrl));
      }
      return response.json(device);
    });
  }

  /**
   * Update existing device.
   * Request params must have a 'deviceId' attribute.
   * Request body should be a key-value object of all the attributes
   * that should be updated.
   *
   * If a device state parameter is updated, the device must be online,
   * so it would be possible to sync to new state to the device using websocket.
   *
   * @param {http.IncomingMessage} req - Client request
   * @param {http.ServerResponse} response - Response object
   * @param {NextFunction} next - next middleware
   */
  static updateDevice(req: Request, response: Response, next: NextFunction): void {
    const params = pick(req.body, [
      'name',
      'state',
    ]);

    Device.findOne({ id: req.params.deviceId, user: req.user }, (err, device: IDeviceModel) => {
      if (err) {
        return next(err);
      }

      if (!device) {
        return next(new ServerError('Requested device does not exist', 404, req.originalUrl));
      }

      // Merge current device attributes with the new attributes
      merge(device, params);

      return DevicesController.onDeviceUpdated(device, params)
        .then(() => device.save())
        .then(() => {
          response.json(device);
        }).catch(next);
    });
  }

  /**
   * Called when a device is updated.
   *
   * If a state parameter was updated, it will sync the new state to that device.
   * For that, the device must be online.
   * @param {object} device - The device model
   * @param {object} params - Changed device parameters
   * @returns {Promise} - If state params were updated, resolved only when the device
   *    has synced successfully.
   *    Otherwise: resolved immediately.
   */
  static onDeviceUpdated(device: IDeviceModel, params: Partial<IDeviceParams>): Promise<void> {
    if (!params.state || config.DISABLE_DEVICE_SYNC) { // if there is no state, or if device sync is disabled
      return Promise.resolve();
    }

    if (!device.isOnline) {
      return Promise.reject(new Error('Cannot update device state: device is offline'));
    }
    return device.getConnection()
      .syncState(params.state);
  }

  /**
   * Delete selected device
   * @param {http.IncomingMessage} req - Client request
   * @param {http.ServerResponse} response - Response object
   * @param {NextFunction} next - next middleware
   */
  static deleteDevice(req: Request, response: Response, next: NextFunction): void {
    Device.remove({
      id: req.params.deviceId,
      user: req.user,
    }, (err) => {
      if (err) {
        return next(err);
      }
      return response.json({ message: 'Device successfully deleted' });
    });
  }
}

export default DevicesController;
