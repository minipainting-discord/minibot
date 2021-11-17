import { importSiblingModules } from "../utils.js"
import logger from "../logger.js"

export async function registerEvents(bot) {
  bot.logger.info("Registering events...")

  const eventList = await importSiblingModules(import.meta.url)

  for (const registerEvent of eventList) {
    try {
      registerEvent(bot)
    } catch (error) {
      logger.fatal(error)
    }
  }
}
