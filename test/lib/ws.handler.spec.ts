import WsHandler from '../../src/lib/ws.handler';
import WebSocket from 'ws';
import SonoffRequestHandler from '../../src/controllers/sonoff.controller';

describe('WS Connection handler', () => {
  let conn: WebSocket;
  let handler: WsHandler;

  beforeEach(() => {
    conn = <WebSocket>{
      readyState: WebSocket.OPEN,
      send: <any>jest.fn(),
      on: <any>jest.fn(),
      terminate: <any>jest.fn(),
      ping: <any>jest.fn(),
    };

    handler = new WsHandler(conn);

    jest.useFakeTimers();
  });

  describe('handleConnection', () => {
    it('initializes connection listener', () => {
      jest.spyOn(handler, 'startPinging').mockImplementation(() => {});

      handler.handleConnection();

      expect(handler.conn.on).toBeCalledWith('message', expect.any(Function));
      expect(handler.conn.on).toBeCalledWith('close', expect.any(Function));
      expect(handler.conn.on).toBeCalledWith('pong', expect.any(Function));
      expect(handler.startPinging).toBeCalled();
      expect(handler.isAlive).toBeTrue();
      expect(handler.messageHandler).toBeInstanceOf(SonoffRequestHandler);
    });
  });

  describe('onMessage', () => {
    beforeEach(() => {
      handler.messageHandler = <any>{
        handleRequest: jest.fn(),
      };
    });

    it('calls handleRequest with parsed json object', () => {
      handler.onMessage('{"a": "b"}');
      expect(handler.messageHandler.handleRequest).toBeCalledWith({ a: 'b' });
    });

    it('ignores non json messages', () => {
      handler.onMessage('Hello');
      expect(handler.messageHandler.handleRequest).not.toBeCalled();
    });
  });

  describe('onClose', () => {
    beforeEach(() => {
      handler.messageHandler = <any>{
        onClose: jest.fn(),
      };
    });

    it('changes isAlive to false', () => {
      handler.isAlive = true;
      handler.onClose(1, 'error');

    });

    it('calls onClose on the message handler', () => {
      handler.onClose(1, 'error');
      expect(handler.messageHandler.onClose).toBeCalled();
    });
  });

  describe('ping mechanism', () => {
    it('calls "ping" every 30 seconds', () => {
      jest.spyOn(handler, 'ping').mockImplementation(() => {});
      handler.startPinging();
      jest.advanceTimersByTime(30000);
      expect(handler.ping).toBeCalled();
      jest.advanceTimersByTime(30000);
      expect(handler.ping).toHaveBeenCalledTimes(2);
    });

    it('terminates connection on ping if not alive', () => {
      handler.isAlive = false;
      handler.ping();
      expect(handler.conn.terminate).toBeCalled();
    });

    it('sets handler as not alive and calls ping', () => {
      handler.isAlive = true;
      handler.ping();
      expect(handler.isAlive).toBeFalse();
      expect(handler.conn.ping).toBeCalled();
    });

    it('sets handler as alive on heartbeat', () => {
      handler.isAlive = false;
      handler.heartbeat();
      expect(handler.isAlive).toBeTrue();
    });
  });
});
