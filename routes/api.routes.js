const deviceController = require('../controllers/devices.controller');
const timersController = require('../controllers/timers.controller');

/**
 * API routes for CRUD operations on the device
 * @param {object} app - express application
 */
module.exports = (app) => {
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
