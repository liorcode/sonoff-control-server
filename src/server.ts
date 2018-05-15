import app from './app';
import wsServer from './wsServer';
import https from 'https';
import fs from 'fs';
import logger from 'winston';
import ErrnoException = NodeJS.ErrnoException;
import conf from './config/config';

const port = conf.SERVER_API_PORT;
// Store in express
app.set('port', port);

/**
 * Create HTTPS server.
 */
const opts = {
  key: fs.readFileSync(`./certs/${conf.SSL_KEY_FILE}`),
  cert: fs.readFileSync(`./certs/${conf.SSL_CERT_FILE}`),
};
const server = https.createServer(opts, app);

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
  logger.info(`API Listening on port ${addr.port}`);
}

/**
 * Listen on provided port, on all network interfaces.
 */

server.listen(port);
server.on('error', onError);
server.on('listening', onListening);

// Start the WS server as well
wsServer(app);
