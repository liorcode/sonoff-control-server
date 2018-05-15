import logger from 'winston';
import { Express } from 'express';
import conf from '../config/config';

export default (app: Express) => {
  /** Request example:
   * { accept: 'ws;2',
     version: 2,
     ts: 933,
     deviceid: '10001f56fa',
     apikey: '023cf7fc-d350-4a74-a6e3-91ee018ab465',
     model: 'ITA-GZ1-GL',
     romVersion: '1.5.5'
     },
   */
  app.route('/dispatch/device')
    .post((req, res) => {
      logger.info('Sonoff is requesting websocket info', req.body);
      res.json({
        error: 0,
        reason: 'ok',
        IP: conf.SERVER_IP,
        port: conf.WEBSOCKET_PORT,
      });
    });
};
