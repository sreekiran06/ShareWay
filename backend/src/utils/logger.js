const winston = require('winston');
const { combine, timestamp, errors, json, colorize, simple } = winston.format;

const logger = winston.createLogger({
  level: 'info',
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    errors({ stack: true }),
    json()
  ),
  defaultMeta: { service: 'shareway-api' },
  transports: [
    new winston.transports.Console({
      format: combine(colorize(), simple())
    })
  ]
});

module.exports = logger;
