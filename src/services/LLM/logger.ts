type LogLevel = 'debug' | 'info' | 'warn' | 'error'

const currentLevel: LogLevel =
  (process.env.LLM_LOG_LEVEL as LogLevel) ?? 'info'

const LEVEL_ORDER: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
}

function shouldLog(level: LogLevel): boolean {
  return LEVEL_ORDER[level] >= LEVEL_ORDER[currentLevel]
}

export const logger = {
  debug(msg: string, ...args: unknown[]) {
    if (shouldLog('debug')) console.log(`[LLM:DEBUG] ${msg}`, ...args)
  },
  info(msg: string, ...args: unknown[]) {
    if (shouldLog('info')) console.log(`[LLM:INFO] ${msg}`, ...args)
  },
  warn(msg: string, ...args: unknown[]) {
    if (shouldLog('warn')) console.warn(`[LLM:WARN] ${msg}`, ...args)
  },
  error(msg: string, ...args: unknown[]) {
    if (shouldLog('error')) console.error(`[LLM:ERROR] ${msg}`, ...args)
  },
}
