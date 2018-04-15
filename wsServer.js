const WebSocket = require('ws');
const https = require('https');
const fs = require('fs');
const url = require('url');
const logger = require('winston');
const serverConfig = require('./config/server.json');

const SonoffRequestHandler = require('./controllers/sonoff.controller');

const opts = {
  key: fs.readFileSync(`./certs/${serverConfig.sslKeyFile}`),
  cert: fs.readFileSync(`./certs/${serverConfig.sslCertFile}`),
};
module.exports = (app) => {
  const server = https.createServer(opts, app);
  const wss = new WebSocket.Server({ server });
  wss.on('connection', (conn, req) => {
    logger.info('WS | Incoming connection');
    const location = url.parse(req.url, true);
    // You might use location.query.access_token to authenticate or share sessions
    // or req.headers.cookie (see http://stackoverflow.com/a/16395220/151312)

    const ctrl = new SonoffRequestHandler(conn);

    conn.on('message', (message) => {
      const reqMessage = JSON.parse(message);
      logger.info('WS | Received message', reqMessage);
      ctrl.handleRequest(reqMessage);
    });

    conn.on('close', (code, reason) => {
      logger.warn('WS | Connection closed');
      ctrl.onClose();
    });
  });

  server.listen(serverConfig.webSocketPort, () => {
    logger.info('WS | Listening on %d', server.address().port);
  });
};
