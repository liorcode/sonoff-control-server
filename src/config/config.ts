import dotenv from 'dotenv';
// Parse dotenv variables. Note: this will also go to process.env
dotenv.config();

const toBoolean = (str: string): boolean => str !== undefined ? JSON.parse(str) : false;
const toNumber = (str: string): number => str !== undefined ? parseInt(str, 10) : 0;

export default {
  GOOGLE_CLIENT_ID: <string> process.env.GOOGLE_CLIENT_ID,
  MONGO_URI: <string> process.env.MONGO_URI,
  MULTI_USER: <boolean> toBoolean(process.env.MULTI_USER),
  SERVER_IP: <string> process.env.SERVER_IP,
  SERVER_API_PORT: <number> toNumber(process.env.SERVER_API_PORT),
  WEBSOCKET_PORT: <number> toNumber(process.env.WEBSOCKET_PORT),
  SERVER_SCHEME: <'http' | 'https'>(process.env.SERVER_SCHEME),
  SSL_KEY_FILE: <string> process.env.SSL_KEY_FILE,
  SSL_CERT_FILE: <string> process.env.SSL_CERT_FILE,
};
