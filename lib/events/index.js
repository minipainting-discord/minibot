import { importSiblingModules } from "../utils.js"
import logger from "../logger.js"

const EVENT = {
  PLAYER_SCORE_UPDATE: "player-score-update",
}

export async function registerEvents(bot) {
  bot.logger.info("Registering events...")

  bot.EVENT = EVENT

  const eventList = await importSiblingModules(import.meta.url)

  for (const registerEvent of eventList) {
    try {
      await registerEvent(bot)
    } catch (error) {
      logger.fatal(registerEvent.name, error)
    }
  }
}
