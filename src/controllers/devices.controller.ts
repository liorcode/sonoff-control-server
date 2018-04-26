import { model } from 'mongoose';
import { NextFunction, Request, Response } from "express";
import { IDeviceModel } from "../models/device.model";

const Device = model('Devices');

class DevicesController {
  /**
   * Get a list of all the devices.
   *
   * @param {http.IncomingMessage} req - Client request
   * @param {http.ServerResponse} response - Response object
   * @param {NextFunction} next - next middleware
   */
  static list(req: Request, response: Response, next: NextFunction): void {
    Device.find({}, (err, list) => {
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
    const newDevice = new Device(req.body);
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
    Device.findOne({ _id: req.params.deviceId }, (err, device) => {
      if (err) {
        return next(err);
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
    const params = req.body;
    Device.findOneAndUpdate(
      { _id: req.params.deviceId },
      { $set: params }, { new: true },
      (err, device: IDeviceModel) => {
        if (err) {
          return next(err);
        }

        return DevicesController.onDeviceUpdated(device, params)
          .then(() => {
            response.json(device);
          });
      },
    );
  }

  /**
   * Called when a device is updated.
   *
   * If a state parameter was updated, it will sync the new state to that device.
   * For that, the device must be online.
   * @param {object} device - The device model
   * @param {object} params - Changed device parameters
   * @returns {Promise} - If state params were updated, resolved only when the device
   *    has synced succesfully.
   *    Otherwise: resolved immediately.
   */
  static onDeviceUpdated(device: IDeviceModel, params: IDeviceModel): Promise<void> {
    if (!params.state) {
      return Promise.resolve();
    }

    if (!device.isOnline()) {
      throw new Error('Cannot sync device: device is offline');
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
      _id: req.params.deviceId,
    }, (err) => {
      if (err) {
        return next(err);
      }
      return response.json({ message: 'Device successfully deleted' });
    });
  }
}

export default DevicesController;
