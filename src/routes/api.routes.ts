import deviceController from '../controllers/devices.controller';
import timersController from '../controllers/timers.controller';
import { Express } from "express";

/**
 * API routes for CRUD operations on the device
 * @param {object} app - express application
 */
export default (app: Express) => {
  app.route('/devices')
    .get(deviceController.list)
    .post(deviceController.create);

  app.route('/devices/:deviceId')
    .get(deviceController.getDevice)
    .patch(deviceController.updateDevice)
    .delete(deviceController.deleteDevice);

  app.route('/devices/:deviceId/timers')
    .get(timersController.list)
    .post(timersController.create);

  app.route('/devices/:deviceId/timers/:timerId')
    .get(timersController.getTimer)
    .patch(timersController.updateTimer)
    .delete(timersController.deleteTimer);
};
