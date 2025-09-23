type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const levelToConsole: Record<LogLevel, (message?: any, ...optionalParams: any[]) => void> = {
  debug: console.debug.bind(console),
  info: console.info.bind(console),
  warn: console.warn.bind(console),
  error: console.error.bind(console)
};

function format(level: LogLevel, message: any, meta?: Record<string, any>) {
  const ts = new Date().toISOString();
  const base = `[${ts}] [${level.toUpperCase()}]`;
  if (meta && Object.keys(meta).length) {
    return `${base} ${String(message)} | ${JSON.stringify(meta)}`;
  }
  return `${base} ${String(message)}`;
}

export const logger = {
  debug(message: any, meta?: Record<string, any>) {
    if (process.env.NODE_ENV !== 'production') levelToConsole.debug(format('debug', message, meta));
  },
  info(message: any, meta?: Record<string, any>) {
    levelToConsole.info(format('info', message, meta));
  },
  warn(message: any, meta?: Record<string, any>) {
    levelToConsole.warn(format('warn', message, meta));
  },
  error(message: any, meta?: Record<string, any>) {
    levelToConsole.error(format('error', message, meta));
  }
};


