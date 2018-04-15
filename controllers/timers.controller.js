const mongoose = require('mongoose');
const logger = require('winston');
const _ = require('lodash');

const Device = mongoose.model('Devices');

class TimersController {
  /**
   * Creates a new timer
   *
   * @param {http.IncomingMessage} req - Client request
   * @param {http.ServerResponse} response - Response object
   * @param {function} next - next middleware
   */
  static create(req, response, next) {
    const { deviceId } = req.params;

    Device.findOne({ deviceId }, (err, device) => {
      if (err) {
        return next(err);
      }

      try {
        device.state.timers.push(req.body);
        const createdTimer = _.last(device.state.timers);
        return TimersController.onTimerUpdated(device)
          .then(() => {
            device.save();
            response.json(createdTimer);
          }).catch(next);
      } catch (e) {
        logger.error(e);
        return next(new Error(`Unable to create timer. Error: ${e.message}`));
      }
    });
  }

  /**
   * Get a list of all the timers.
   *
   * @param {http.IncomingMessage} req - Client request
   * @param {http.ServerResponse} response - Response object
   * @param {function} next - next middleware
   */
  static list(req, response, next) {
    const { deviceId } = req.params;

    Device.findOne({ deviceId })
      .select('state.timers')
      .exec((err, device) => {
        if (err) {
          return next(err);
        }
        const timers = _.get(device, 'state.timers', []);
        response.json(timers);
      });
  }

  /**
   * Get timer by id.
   *
   * @param {http.IncomingMessage} req - Client request
   * @param {http.ServerResponse} response - Response object
   * @param {function} next - next middleware
   */
  static getTimer(req, response, next) {
    const { deviceId, timerId } = req.params;

    Device.findOne({ deviceId }, (err, device) => {
      if (err) {
        return next(err);
      }
      try {
        const timer = device.state.timers.id(timerId);
        response.json(timer);
      } catch (e) {
        logger.error(e);
        return next(new Error(`Cannot find timer ${timerId}`));
      }
    });
  }

  /**
   * Update existing timer.
   * Request params must have a 'deviceId' attribute.
   * Request body should be a key-value object of all the attributes
   * that should be updated.
   *
   * If a device state parameter is updated, the device must be online,
   * so it would be possible to sync to new state to the device using websocket.
   *
   * @param {http.IncomingMessage} req - Client request
   * @param {http.ServerResponse} response - Response object
   * @param {function} next - next middleware
   */
  static updateTimer(req, response, next) {
    const { deviceId, timerId } = req.params;

    Device.findOne({ deviceId }, (err, device) => {
      if (err) {
        return next(err);
      }

      try {
        const timer = device.state.timers.id(timerId);
        timer.set(req.body);

        TimersController.onTimerUpdated(device)
          .then(() => {
            device.save();
            response.json(timer);
          }).catch(next);
      } catch (e) {
        logger.error(e);
        return next(new Error(`Cannot update timer ${timerId}: ${e.message}`));
      }
    });
  }

  /**
   * Delete selected device
   * @param {http.IncomingMessage} req - Client request
   * @param {http.ServerResponse} response - Response object
   * @param {function} next - next middleware
   */
  static deleteTimer(req, response, next) {
    const { deviceId, timerId } = req.params;

    Device.findOne({ deviceId }, (err, device) => {
      if (err) {
        return next(err);
      }

      try {
        const timer = device.state.timers.id(timerId);
        timer.remove();

        TimersController.onTimerUpdated(device)
          .then(() => {
            device.save();
            response.json({});
          }).catch(next);
      } catch (e) {
        return next(new Error(`Unable to delete timer ${timerId}: ${e}`));
      }
    });
  }

  /**
   * Called when a timer is updated.
   *
   * If a state parameter was updated, itw ill sync the new state to that device.
   * For that, the device must be online.
   * @param {object} device - The device model
   * @returns {Promise} - resolves when the device has synced successfully
   */
  static onTimerUpdated(device) {
    if (!device.isOnline()) {
      throw new Error('Cannot sync device: device is offline');
    }
    return device.getConnection()
      .syncState({ timers: device.state.timers });
  }
}

module.exports = TimersController;
