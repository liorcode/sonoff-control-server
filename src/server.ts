import app from './app';
import wsServer from './wsServer';
import https from 'https';
import http from 'http';
import fs from 'fs';
import logger from 'winston';
import ErrnoException = NodeJS.ErrnoException;
import conf from './config/config';

const port = conf.API_PORT;
// Store in express
app.set('port', port);

/**
 * Create HTTP or HTTPS server, based on config
 */
const server = conf.SERVER_SCHEME === 'https' ? https.createServer({
  key: fs.readFileSync(conf.SSL_KEY_FILE),
  cert: fs.readFileSync(conf.SSL_CERT_FILE),
}, app) : http.createServer(app);

/**
 * Event listener for HTTP server "error" event.
 */

function onError(error: ErrnoException) {
  if (error.syscall !== 'listen') {
    throw error;
  }

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case 'EACCES':
      logger.error(`Port ${port} requires elevated privileges`);
      process.exit(1);
      break;
    case 'EADDRINUSE':
      logger.error(`Port ${port} is already in use`);
      process.exit(1);
      break;
    default:
      throw error;
  }
}

/**
 * Event listener for HTTP server "listening" event.
 */

function onListening() {
  const addr = server.address();
  logger.info(`API | Listening on ${conf.API_HOST}:${addr.port} (${conf.SERVER_SCHEME})`);
}

/**
 * Listen on provided port, on all network interfaces.
 */

server.listen(port, conf.API_HOST);
server.on('error', onError);
server.on('listening', onListening);

// Start the WS server as well
wsServer(app);
