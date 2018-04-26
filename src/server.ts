import app from './app';
import https from 'https';
import fs from 'fs';
import logger from 'winston';
import ErrnoException = NodeJS.ErrnoException;
import dotenv from 'dotenv';

// Load environment variables from .env file into process.env
dotenv.config();

/**
 * Normalize a port into a number, string, or false.
 */

function normalizePort(val: string): string | number {
  const port = parseInt(val, 10);

  if (isNaN(port)) {
    // named pipe
    return val;
  }

  if (port >= 0) {
    // port number
    return port;
  }

  throw new Error(`Invalid port number: ${val}`);
}
const port = normalizePort(process.env.SERVER_API_PORT);
// Store in express
app.set('port', port);

/**
 * Create HTTPS server.
 */
const opts = {
  key: fs.readFileSync(`./certs/${process.env.SSL_KEY_FILE}`),
  cert: fs.readFileSync(`./certs/${process.env.SSL_CERT_FILE}`),
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
