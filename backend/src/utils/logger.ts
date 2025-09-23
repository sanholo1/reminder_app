import fs from 'fs';
import path from 'path';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const levelToConsole: Record<LogLevel, (message?: any, ...optionalParams: any[]) => void> = {
  debug: console.debug.bind(console),
  info: console.info.bind(console),
  warn: console.warn.bind(console),
  error: console.error.bind(console)
};

function formatMessage(level: LogLevel, message: any, meta?: Record<string, any>) {
  const timestamp = new Date().toISOString();
  const base = `[${timestamp}] [${level.toUpperCase()}]`;
  if (meta && Object.keys(meta).length > 0) {
    return `${base} ${String(message)} | ${JSON.stringify(meta)}`;
  }
  return `${base} ${String(message)}`;
}

function ensureLogDirExists(dir: string) {
  try {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  } catch {}
}

function getLogFilePath(): string {
  const baseDir = process.env.LOG_DIR || path.join(process.cwd(), 'logs');
  ensureLogDirExists(baseDir);
  const datePart = new Date().toISOString().slice(0, 10); 
  const fileName = process.env.LOG_FILE || `app-${datePart}.log`;
  return path.join(baseDir, fileName);
}

function writeToFile(line: string) {
  try {
    const filePath = getLogFilePath();
    fs.appendFile(filePath, line + '\n', (err) => {
      if (err) {
        
        console.error('[LOGGER] Failed to write log file', err);
      }
    });
  } catch (e) {
    console.error('[LOGGER] Unexpected logging error', e);
  }
}

export const logger = {
  debug(message: any, meta?: Record<string, any>) {
    const line = formatMessage('debug', message, meta);
    if (process.env.NODE_ENV !== 'production') {
      levelToConsole.debug(line);
    }
    if (process.env.LOG_TO_FILE !== 'false') writeToFile(line);
  },
  info(message: any, meta?: Record<string, any>) {
    const line = formatMessage('info', message, meta);
    levelToConsole.info(line);
    if (process.env.LOG_TO_FILE !== 'false') writeToFile(line);
  },
  warn(message: any, meta?: Record<string, any>) {
    const line = formatMessage('warn', message, meta);
    levelToConsole.warn(line);
    if (process.env.LOG_TO_FILE !== 'false') writeToFile(line);
  },
  error(message: any, meta?: Record<string, any>) {
    const line = formatMessage('error', message, meta);
    levelToConsole.error(line);
    if (process.env.LOG_TO_FILE !== 'false') writeToFile(line);
  }
};


