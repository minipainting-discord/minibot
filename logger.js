import chalk from "chalk"

export default function createLogger() {
  const logger = {
    info(message, ...args) {
      console.log(chalk`{gray ${timestamp()}} {blue info} ${message}`, ...args)
    },

    debug(message, ...args) {
      console.log(chalk`{gray ${timestamp()}} {gray debug} ${message}`, ...args)
    },

    error(message, ...args) {
      console.error(
        chalk`{gray ${timestamp()}} {red error} ${message}`,
        ...args
      )
    },

    fatal(message, ...args) {
      console.error(
        chalk`{gray ${timestamp()}} {magenta fatal} ${message}`,
        ...args
      )
      console.trace()
      process.exit(1)
    },

    warn(message, ...args) {
      console.log(
        chalk`{gray ${timestamp()}} {yellow warn} ${message}`,
        ...args
      )
    },

    trace(message, ...args) {
      console.trace(message, ...args)
    },
  }

  return {
    ...logger,
    child: () => logger,
  }
}

function timestamp() {
  return `[${new Date().toISOString()}]`
}
