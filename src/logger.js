const winston = require('winston');
const config = require('./config');

const logger = winston.createLogger({
  level: config.logging.level,
  transports: [
    new winston.transports.Console(),
  ],
  format: winston.format.combine(
    winston.format.colorize(),
    winston.format.simple(),
  ),
});


module.exports = logger;
