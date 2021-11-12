import https from 'https';
import http from 'http';
import fs from 'fs';
import logger from 'winston';
import ErrnoException = NodeJS.ErrnoException;
import { ServerConfiguration } from './config/config';
import { Express } from 'express-serve-static-core';

export default function (conf: ServerConfiguration, app?: Express) {
  /**
   * Create HTTP or HTTPS server, based on config
   */
  const server = conf.SCHEME === 'https' ? https.createServer({
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
        logger.error(`Port ${conf.PORT} requires elevated privileges`);
        process.exit(1);
        break;
      case 'EADDRINUSE':
        logger.error(`Port ${conf.PORT} is already in use`);
        process.exit(1);
        break;
      case 'ECONNRESET':
        logger.warn('Connection reset');
        break;
      default:
        throw error;
    }
  }
  /**
   * Listen on provided port, on all network interfaces.
   */

  server.listen(conf.PORT, () => {
    logger.info(`${conf.DESCRIPTION} | Listening on ${conf.PORT} (${conf.SCHEME})`);
  });
  server.on('error', onError);

  return server;
}
