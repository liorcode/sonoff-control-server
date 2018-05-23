import dotenv from 'dotenv';
// Parse dotenv variables. Note: this will also go to process.env
dotenv.config();

const toBoolean = (str: string): boolean => str !== undefined ? JSON.parse(str) : false;
const toNumber = (str: string): number => str !== undefined ? parseInt(str, 10) : 0;

export default {
  GOOGLE_CLIENT_ID: <string> process.env.GOOGLE_CLIENT_ID,
  MONGO_URI: <string> process.env.MONGO_URI,
  MULTI_USER: <boolean> toBoolean(process.env.MULTI_USER),
  API_HOST: <string> process.env.API_HOST,
  API_PORT: <number> toNumber(process.env.API_PORT),
  WEBSOCKET_HOST: <string> process.env.WEBSOCKET_HOST,
  WEBSOCKET_PORT: <number> toNumber(process.env.WEBSOCKET_PORT),
  SERVER_SCHEME: <'http' | 'https'>(process.env.SERVER_SCHEME),
  SSL_KEY_FILE: <string> process.env.SSL_KEY_FILE,
  SSL_CERT_FILE: <string> process.env.SSL_CERT_FILE,
  LOG_LEVEL: <string> process.env.LOG_LEVEL,
};
