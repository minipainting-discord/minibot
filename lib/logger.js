import chalk from "chalk"

const logger = {
  info(message) {
    console.log(chalk`{blue info} ${message}`)
  },

  error(message) {
    console.error(chalk`{red error} ${message}`)
  },

  debug(message) {
    console.log(chalk`{gray debug} ${message}`)
  },

  fatal(message) {
    console.error(chalk`{magenta fatal} ${message}`)
    console.trace()
  },

  warn(message) {
    console.log(chalk`{yellow warn} ${message}`)
  },

  trace(message) {
    console.trace(message)
  },
}

export default {
  ...logger,
  child: () => logger,
}
