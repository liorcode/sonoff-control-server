import app from './app';
import https from 'https';
import fs from 'fs';
import logger from 'winston';
import ErrnoException = NodeJS.ErrnoException;

/**
 * Get port from environment and store in Express.
 */
/**
 * Normalize a port into a number, string, or false.
 */

function normalizePort(val: string) {
  const port = parseInt(val, 10);

  if (isNaN(port)) {
    // named pipe
    return val;
  }

  if (port >= 0) {
    // port number
    return port;
  }

  return false;
}
const port = normalizePort(process.env.PORT || '1080');
app.set('port', port);


/**
 * Create HTTPS server.
 */
const opts = {
  key: fs.readFileSync('./certs/66805011.key'),
  cert: fs.readFileSync('./certs/66805011.cert'),
};
const server = https.createServer(opts, app);

/**
 * Event listener for HTTP server "error" event.
 */

function onError(error: ErrnoException) {
  if (error.syscall !== 'listen') {
    throw error;
  }

  const bind = typeof port === 'string'
    ? `Pipe ${port}`
    : `Port ${port}`;

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case 'EACCES':
      logger.error(`${bind} requires elevated privileges`);
      process.exit(1);
      break;
    case 'EADDRINUSE':
      logger.error(`${bind} is already in use`);
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
  const bind = typeof addr === 'string'
    ? `pipe ${addr}`
    : `port ${addr.port}`;
  logger.info(`API Listening on ${bind}`);
}

/**
 * Listen on provided port, on all network interfaces.
 */

server.listen(port);
server.on('error', onError);
server.on('listening', onListening);
