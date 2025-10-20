import cron from "node-cron"
import parseSchedule from "friendly-node-cron"
import { Bot } from "../bot"
import { getTodaysAdventWord } from "../models/AdventWord"

const LOG_SCOPE = "workflow/advent"
const TIMEZONE = "America/New_York"

export default async function advent(bot: Bot) {
  cron.schedule(
    parseSchedule("every day at 00:00 from 1 through 24 of december"),
    () => sayDailyWord(bot),
    {
      timezone: TIMEZONE,
    },
  )
}

async function sayDailyWord(bot: Bot) {
  const adventWord = await getTodaysAdventWord(bot.db)

  if (!adventWord) {
    return bot.logger.error(LOG_SCOPE, "Unable to find today's word.")
  }

  const message = await bot.channels.advent.send(
    `:calendar_spiral: Howdy ${bot.roles.advent}! Today's word is: **${adventWord.word}**`,
  )
  await message.pin()

  bot.logger.info(LOG_SCOPE, `Sent daily word ${adventWord.word}`)
}
