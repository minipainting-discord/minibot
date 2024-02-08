// import { EmbedBuilder } from "discord.js"
import chalk from "chalk"
import { EventEmitter } from "node:events"

type LogLevel = "info" | "warn" | "error" | "fatal"

type LogEvent = {
  level: LogLevel
  scope: string
  message: string
  error?: Error
}

interface Logger {
  events: EventEmitter
  info(scope: string, message: string): void
  warn(scope: string, message: string): void
  error(scope: string, message: string, error?: unknown): void
  fatal(scope: string, message: string, error?: unknown): never
  child(): Partial<Logger>
}

const COLORS = {
  info: "blue",
  warn: "yellow",
  error: "red",
  fatal: "magenta",
  // moderation: "bgYellow", // TODO: Remove
} as const

const DISCORD_COLORS = {
  info: "#0098d9",
  warn: "#f6c42f",
  error: "#f52565",
  fatal: "#a05bb4",
  // moderation: "#f59207", // TODO: Remove
} as const

function createLogger(): Logger {
  const events = new EventEmitter()

  function format(level: LogLevel, scope: string, message: string) {
    return [
      chalk.gray(`[${new Date().toISOString().slice(0, -1)}]`),
      chalk[COLORS[level]](level),
      `[${scope}]`,
      message,
    ].join(" ")
  }

  const logger: Logger = {
    events,

    info(scope, message) {
      console.log(format("info", scope, message))
      events.emit("log", { level: "info", scope, message })
    },

    warn(scope, message) {
      console.log(format("warn", scope, message))
      events.emit("log", { level: "warn", scope, message })
    },

    error(scope, message, error) {
      console.error(format("error", scope, message), error)
      events.emit("log", { level: "error", scope, message, error })
    },

    fatal(scope, message, error) {
      console.error(format("fatal", scope, message), error)
      events.emit("log", { level: "fatal", scope, message })
      console.trace()
      process.exit(1)
    },

    child: () => logger,
  }

  return logger
}

export { createLogger, DISCORD_COLORS }
export type { Logger, LogLevel, LogEvent }
