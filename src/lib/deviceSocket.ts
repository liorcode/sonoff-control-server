import logger from 'winston';
import WebSocket from 'ws';
import { IDeviceModel, IDeviceState } from '../models/device.model';
import { ITimerParams } from '../models/timer.schema';

interface IDeviceMessage {
  switch?: 'on' | 'off';
  startup?: 'on' | 'off' | 'keep';
  rssi?: string;
  timers?: ITimerParams[] | 0;
}

class DeviceSocket {
  pendingMessages = new Map();

  constructor(readonly connection: WebSocket,
              readonly apiKey: string,
              readonly device: IDeviceModel) {
  }

  /**
   * Returns true if the websocket state is open
   * @returns {boolean}
   */
  isConnectionAlive(): boolean {
    return this.connection.readyState === WebSocket.OPEN;
  }

  /**
   * Synchronize the new state to the device
   * @param {object} newState - State parameters to sync with device
   * @returns {Promise<any>} - Resolved on device ack or rejects on timeout
   */
  syncState(newState: Partial<IDeviceState>): Promise<void> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Cannot sync device state: timeout'));
      }, 2000);

      const message: IDeviceMessage = Object.assign({}, newState);
      if (message.timers) {
        // when there are no timers, the timers property must be 0
        message.timers = message.timers.length === 0 ? 0
          // if there are timers, just get the needed props
          : message.timers.map((timer: ITimerParams) => ({
            enabled: timer.enabled,
            at: timer.at,
            type: timer.type,
            do: { switch: timer.do.switch },
          }));
      }

      return this.sendMessage(message).then(() => {
        resolve();
        clearInterval(timeout);
      }, reject);
    });
  }

  /**
   * Called when the device acknowladges a message.
   * Removes the acknowladged message from the pending messages queue.
   * @param {string} messageId
   */
  onAck(messageId: string) {
    if (!this.pendingMessages.has(messageId)) {
      logger.warn('Device sent an ack for unknown message %s', messageId);
      return;
    }
    const msg = this.pendingMessages.get(messageId);
    logger.info('Message acknowledged by device', msg.message);
    msg.resolve(); // this will make the controller send the response
    this.pendingMessages.delete(messageId);
  }

  /**
   * Sends a message to the device
   * @param {object} params parameters to send to device
   * @returns {Promise<any>}
   */
  sendMessage(params: IDeviceMessage) {
    if (!this.isConnectionAlive()) {
      throw new Error('Cannot send WS message: connection is not open');
    }

    const message = {
      params,
      apikey: this.apiKey,
      action: 'update',
      deviceid: this.device.id,
      userAgent: 'app',
      from: 'app',
      sequence: Date.now().toString(),
      ts: 0,
    };
    logger.info('Sending message', message);
    this.connection.send(JSON.stringify(message));
    return new Promise((resolve, reject) => {
      this.pendingMessages.set(message.sequence, {
        message,
        resolve,
        reject,
      });
    });
  }
}

export default DeviceSocket;
