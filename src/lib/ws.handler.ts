import WebSocket from 'ws';
import logger from 'winston';
import SonoffRequestHandler from '../controllers/sonoff.controller';

const PING_INTERVAL = 30000; // ping every 30 seconds

class WsHandler {
  messageHandler: SonoffRequestHandler;
  isAlive: boolean;
  interval: number;

  constructor(readonly conn: WebSocket) {
  }

  /**
   * Called when the connection is opened
   */
  handleConnection() {
    logger.info('WS | Incoming connection');
    this.isAlive = true; // since this class is created on connection, obviously the initial state is alive.
    // this handler will be used for incoming messages
    this.messageHandler = new SonoffRequestHandler(this.conn);

    // Register event listeners
    this.conn.on('message', this.onMessage.bind(this));
    this.conn.on('close', this.onClose.bind(this));
    this.conn.on('pong', this.heartbeat.bind(this));

    // Ping every 30 seconds
    this.interval = setInterval(this.ping.bind(this), PING_INTERVAL);
  }

  /**
   * Closed when a message is received by streamer.
   *
   * @param {string} message
   */
  onMessage(message: string) {
    try {
      const reqMessage = JSON.parse(message);
      logger.info('WS | Received message', reqMessage);
      this.messageHandler.handleRequest(reqMessage);
    } catch (e) { // avoid crashing the app for an invalid message
      logger.error(`Cannot handle message '${message}'`, e);
    }
  }

  /**
   * Called on connection close event
   * @param {number} code
   * @param {string} reason
   */
  onClose (code: number, reason: string) {
    logger.warn('WS | Connection closed');
    this.isAlive = false;
    clearInterval(this.interval);
    this.messageHandler.onClose();
  }

  /**
   * Ping-pong, to detect in-active connections.
   * @see {@link https://github.com/websockets/ws#how-to-detect-and-close-broken-connections}
   */
  ping() {
    if (!this.isAlive) {
      logger.warn('No pong received in %d seconds. terminating connection', PING_INTERVAL / 1000);
      // if connection not marked as alive, it means that 30 seconds has passed thing last "ping". terminate it.
      return this.conn.terminate();
    }
    // Marks the connection as inactive and fire a "ping" event. if "pong" will be received, mark it back as alive
    this.isAlive = true;
    logger.info('PING?');
    this.conn.ping(() => {}); // noop
  }

  /**
   * Called on "pong" event.
   * Marks the connection as "active"
   * @param {WebSocket} conn
   */
  heartbeat(conn: WebSocket) {
    logger.info('PONG!');
    this.isAlive = true;
  }
}

export default WsHandler;
