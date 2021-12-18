import chalk from "chalk"

export default function createLogger() {
  const logger = {
    info(scope, message, ...args) {
      console.log(
        chalk`{gray ${timestamp()}} {blue info} [${scope}] ${message}`,
        ...args
      )
    },

    warn(scope, message, ...args) {
      console.log(
        chalk`{gray ${timestamp()}} {yellow warn} [${scope}] ${message}`,
        ...args
      )
    },

    error(scope, message, ...args) {
      console.error(
        chalk`{gray ${timestamp()}} {red error} [${scope}] ${message}`,
        ...args
      )
    },

    fatal(scope, message, ...args) {
      console.error(
        chalk`{gray ${timestamp()}} {magenta fatal} [${scope}] ${message}`,
        ...args
      )
      console.trace()
      process.exit(1)
    },
  }

  return {
    ...logger,
    child: () => logger,
  }
}

function timestamp() {
  return `[${new Date().toISOString().slice(0, -1)}]`
}
