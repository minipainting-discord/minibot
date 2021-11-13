import chalk from "chalk"

const logger = {
  info(message, ...args) {
    console.log(chalk`{blue info} ${message}`, ...args)
  },

  error(message, ...args) {
    console.error(chalk`{red error} ${message}`, ...args)
  },

  debug(message, ...args) {
    console.log(chalk`{gray debug} ${message}`, ...args)
  },

  fatal(message, ...args) {
    console.error(chalk`{magenta fatal} ${message}`, ...args)
    console.trace()
  },

  warn(message, ...args) {
    console.log(chalk`{yellow warn} ${message}`, ...args)
  },

  trace(message, ...args) {
    console.trace(message, ...args)
  },
}

export default {
  ...logger,
  child: () => logger,
}
