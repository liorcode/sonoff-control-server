import dotenv from 'dotenv';
// Parse dotenv variables. Note: this will also go to process.env
dotenv.config();

const toBoolean = (str: string): boolean => str !== undefined ? JSON.parse(str) : false;
const toNumber = (str: string): number => str !== undefined ? parseInt(str, 10) : 0;

export interface ServerConfiguration {
  DESCRIPTION: string;
  SCHEME: 'http' | 'https';
  HOST: string;
  PORT: number;
  EXTERNAL_PORT: number;
  SSL_KEY_FILE: string;
  SSL_CERT_FILE: string;
}

export default {
  GOOGLE_CLIENT_ID: <string> process.env.GOOGLE_CLIENT_ID,
  MONGO_URI: <string> process.env.MONGO_URI,
  MULTI_USER: <boolean> toBoolean(process.env.MULTI_USER),
  API_SERVER: <ServerConfiguration>{
    DESCRIPTION: 'API Server',
    SCHEME: process.env.API_SCHEME,
    HOST: process.env.API_HOST,
    PORT: toNumber(process.env.API_PORT),
    EXTERNAL_PORT: toNumber(process.env.API_EXTERNAL_PORT),
    SSL_KEY_FILE: process.env.SSL_KEY_FILE,
    SSL_CERT_FILE: process.env.SSL_CERT_FILE,
  },
  WEBSOCKET_SERVER: <ServerConfiguration> {
    DESCRIPTION: 'WebSocket Server',
    SCHEME: process.env.WEBSOCKET_SCHEME,
    HOST: process.env.WEBSOCKET_HOST,
    PORT: toNumber(process.env.WEBSOCKET_PORT),
    EXTERNAL_PORT: toNumber(process.env.WEBSOCKET_EXTERNAL_PORT),
    SSL_KEY_FILE: process.env.SSL_KEY_FILE,
    SSL_CERT_FILE: process.env.SSL_CERT_FILE,
  },
  LOG_LEVEL: <string> process.env.LOG_LEVEL,
};
