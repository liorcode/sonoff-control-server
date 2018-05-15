import WebSocket from 'ws';
import https from 'https';
import fs from 'fs';
import url from 'url';
import logger from 'winston';
import SonoffRequestHandler from './controllers/sonoff.controller';
import { Express } from 'express';
import conf from './config/config';

const opts = {
  key: fs.readFileSync(`./certs/${conf.SSL_KEY_FILE}`),
  cert: fs.readFileSync(`./certs/${conf.SSL_CERT_FILE}`),
};
export default (app: Express) => {
  const server = https.createServer(opts, app);
  const wss = new WebSocket.Server({ server });
  wss.on('connection', (conn: WebSocket, req) => {
    logger.info('WS | Incoming connection');
    const location = url.parse(req.url, true);
    // You might use location.query.access_token to authenticate or share sessions
    // or req.headers.cookie (see http://stackoverflow.com/a/16395220/151312)

    const ctrl = new SonoffRequestHandler(conn);

    conn.on('message', (message: string) => {
      const reqMessage = JSON.parse(message);
      logger.info('WS | Received message', reqMessage);
      ctrl.handleRequest(reqMessage);
    });

    conn.on('close', (code, reason) => {
      logger.warn('WS | Connection closed');
      ctrl.onClose();
    });
  });

  server.listen(conf.WEBSOCKET_PORT, () => {
    logger.info('WS | Listening on %d', server.address().port);
  });
};
