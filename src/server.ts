import WebSocket from 'ws';
import app from './app';
import createServer from './server.factory';
import conf from './config/config';
import WsHandler from './lib/ws.handler';

// Create API Server and start listening
createServer(conf.API_SERVER, app);

// Create WS Server and start listening
const wsServer = createServer(conf.WEBSOCKET_SERVER);
const wss = new WebSocket.Server({ server: wsServer });
wss.on('connection', (conn) => {
  const handler = new WsHandler(conn);
  handler.handleConnection();
});
