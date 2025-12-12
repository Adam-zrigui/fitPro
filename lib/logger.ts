// Enhanced logger with levels, timestamping and namespacing.
// Controls:
// - LOG_LEVEL: one of 'silent'|'error'|'warn'|'info'|'debug' (case-insensitive)
// - DEBUG: if 'true' enables debug-level logs when LOG_LEVEL is not set

export type LogLevel = 'silent' | 'error' | 'warn' | 'info' | 'debug'

const LEVELS: Record<LogLevel, number> = {
  silent: 0,
  error: 1,
  warn: 2,
  info: 3,
  debug: 4,
}

function readEnvLogLevel(): LogLevel {
  const raw = (process.env.LOG_LEVEL || process.env.DEBUG || '').toString().toLowerCase()
  if (raw === 'true' && process.env.NODE_ENV !== 'production') return 'debug'
  if (raw && (Object.keys(LEVELS) as string[]).includes(raw)) return raw as LogLevel
  // Default: in development allow debug; in production allow info
  return process.env.NODE_ENV === 'production' ? 'info' : 'debug'
}

const CURRENT_LEVEL = readEnvLogLevel()

function shouldLog(level: LogLevel) {
  return LEVELS[level] <= LEVELS[CURRENT_LEVEL]
}

function timestamp() {
  return new Date().toISOString()
}

function formatPrefix(level: LogLevel, namespace?: string) {
  const n = namespace ? `${namespace} ` : ''
  return `[${timestamp()}] [${level.toUpperCase()}] ${n}`
}

type LogFn = (...args: unknown[]) => void

function createLogger(namespace?: string) {
  const ns = namespace ? `${namespace}` : undefined

  const debug: LogFn = (...args) => {
    if (!shouldLog('debug')) return
    // eslint-disable-next-line no-console
    console.debug(formatPrefix('debug', ns), ...args)
  }

  const info: LogFn = (...args) => {
    if (!shouldLog('info')) return
    // eslint-disable-next-line no-console
    console.info(formatPrefix('info', ns), ...args)
  }

  const warn: LogFn = (...args) => {
    if (!shouldLog('warn')) return
    // eslint-disable-next-line no-console
    console.warn(formatPrefix('warn', ns), ...args)
  }

  const error: LogFn = (...args) => {
    if (!shouldLog('error')) return
    // Always print errors (even when level < error the check above ensures) — use console.error
    // eslint-disable-next-line no-console
    console.error(formatPrefix('error', ns), ...args)
  }

  return { debug, info, warn, error, namespace: ns } as const
}

// Default logger (no namespace)
const defaultLogger = createLogger()

export const debug = (...args: unknown[]) => defaultLogger.debug(...args)
export const info = (...args: unknown[]) => defaultLogger.info(...args)
export const warn = (...args: unknown[]) => defaultLogger.warn(...args)
export const error = (...args: unknown[]) => defaultLogger.error(...args)

export function logger(namespace: string) {
  return createLogger(namespace)
}

export default {
  debug,
  info,
  warn,
  error,
  logger,
}
