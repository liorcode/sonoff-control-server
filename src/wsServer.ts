import WebSocket from 'ws';
import https from 'https';
import http from 'http';
import fs from 'fs';
import url from 'url';
import logger from 'winston';
import SonoffRequestHandler from './controllers/sonoff.controller';
import { Express } from 'express';
import conf from './config/config';

export default (app: Express) => {
  /**
   * Create HTTP or HTTPS server, based on config
   */
  const server = conf.SERVER_SCHEME === 'https' ? https.createServer({
    key: fs.readFileSync(conf.SSL_KEY_FILE),
    cert: fs.readFileSync(conf.SSL_CERT_FILE),
  }, app) : http.createServer(app);
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

  server.listen(conf.WEBSOCKET_PORT, conf.WEBSOCKET_HOST, () => {
    logger.info(`WS | Listening on ${conf.WEBSOCKET_HOST}:${conf.WEBSOCKET_PORT} (${conf.SERVER_SCHEME})`);
  });
};
