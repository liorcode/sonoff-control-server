import WebSocket from 'ws';
import logger from 'winston';
import SonoffRequestHandler from './controllers/sonoff.controller';

export default (conn: WebSocket) => {
  logger.info('WS | Incoming connection');
  const ctrl = new SonoffRequestHandler(conn);

  conn.on('message', (message: string) => {
    try {
      const reqMessage = JSON.parse(message);
      logger.info('WS | Received message', reqMessage);
      ctrl.handleRequest(reqMessage);
    } catch (e) { // avoid crashing the app for an invalid message
      logger.error(`Cannot handle message '${message}'`, e);
    }
  });

  conn.on('close', (code, reason) => {
    logger.warn('WS | Connection closed');
    ctrl.onClose();
  });
};
