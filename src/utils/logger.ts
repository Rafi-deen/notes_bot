import pino from 'pino';

export const logger = pino({
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true, // Enable color output
      translateTime: 'HH:MM:ss.l', // Human-readable time format
      ignore: 'pid,hostname', // Exclude fields from logs
    },
  },
});