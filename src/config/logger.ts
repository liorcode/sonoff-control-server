import winston from 'winston';
import conf from './config';

winston.configure({
  transports: [
    new (winston.transports.Console)({ level: conf.LOG_LEVEL, timestamp: true }),
  ],
});
