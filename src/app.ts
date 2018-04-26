import express, {NextFunction, Request, Response} from 'express';
import morgan from 'morgan';
import bodyParser from 'body-parser';
import mongoose from 'mongoose';
import './models/device.model';
import wsServer from './wsServer';
import apiRoutes from './routes/api.routes';
import sonoffRoutes from './routes/sonoff.routes';

const app = express();
// mongoose instance connection url connection
mongoose.Promise = global.Promise;
mongoose.connect('mongodb://localhost/SmartHomeDB');

app.use(morgan('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

apiRoutes(app);
sonoffRoutes(app);
wsServer(app);

// catch 404 and forward to error handler
app.use((req: Request, res: Response, next: NextFunction) => {
  next(new ServerError('Not Found', 404, req.originalUrl));
});

// error handler
app.use((err: ServerError, req: Request, res: Response) => {
  res.status(err.status || 500);
  res.json({
    message: err.message,
    error: req.app.get('env') === 'development' ? err : {},
  });
});

export default app;
