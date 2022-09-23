const winston = require("winston");
require("winston-daily-rotate-file");

let generalTransport = new winston.transports.DailyRotateFile({
  filename: "%DATE%.log",
  datePattern: "MM-DD-YYYY",
  maxFiles: "14",
  dirname: "./logs/runtime",
});

const generalLogConfiguration = {
  transports: [new winston.transports.Console(), generalTransport],
  format: winston.format.combine(
    winston.format.timestamp({
      format: "MM-DD-YYYY HH:mm:ss",
    }),
    winston.format.printf((info) => `${[info.timestamp]}: ${info.level}: ${info.message}`)
  ),
};

const startUpLogConfiguration = {
  transports: [
    new winston.transports.File({
      filename: "logs/startUpTimes.log",
    }),
  ],
  format: winston.format.combine(
    winston.format.timestamp({
      format: "MM-DD-YYYY HH:mm:ss",
    }),
    winston.format.printf((info) => `${[info.timestamp]}: ${info.level}: ${info.message}`)
  ),
};

const logger = winston.createLogger(generalLogConfiguration);
const startUpLogger = winston.createLogger(startUpLogConfiguration);

module.exports.logger = logger;
module.exports.startUpLogger = startUpLogger;
