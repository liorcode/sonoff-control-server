import express, { NextFunction, Request, Response } from 'express';
import morgan from 'morgan';
import bodyParser from 'body-parser';
import mongoose from 'mongoose';
import './models/device.model';
import apiRoutes from './routes/api.routes';
import sonoffRoutes from './routes/sonoff.routes';
import passport from 'passport';
import passportConfig from './config/passport';
import conf from './config/config';
import ServerError from './lib/ServerError';

passportConfig(); // run passport config

const app = express();
mongoose.Promise = global.Promise; // use the global Promise for mongoose
mongoose.connect(conf.MONGO_URI);

app.use(morgan('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(passport.initialize());

apiRoutes(app);
sonoffRoutes(app);

// catch 404 and forward to error handler
app.use((req: Request, res: Response, next: NextFunction) => {
  next(new ServerError('Not Found', 404, req.originalUrl));
});

// error handler. Must expect 4 args to work
app.use((err: ServerError, req: Request, res: Response, next: NextFunction) => {
  res.status(err.status || 500);
  res.json({
    message: err.message,
    error: req.app.get('env') === 'development' ? err : {},
  });
});

export default app;
