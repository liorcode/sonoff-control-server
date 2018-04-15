const express = require('express');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

require('./models/device.model');
const wsServer = require('./wsServer');
const apiRoutes = require('./routes/api.routes');
const sonoffRoutes = require('./routes/sonoff.routes');

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
app.use((req, res, next) => {
  const err = new Error('Not Found');
  err.status = 404;
  err.requestedUrl = req.originalUrl;
  next(err);
});

// error handler
app.use((err, req, res, next) => {
  res.status(err.status || 500);
  res.json({
    message: err.message,
    error: req.app.get('env') === 'development' ? err : {},
  });
});


module.exports = app;
