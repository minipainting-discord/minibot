import cron from "node-cron"
import parseSchedule from "friendly-node-cron"
import { Bot } from "../bot"

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
  const dayOfMonth = new Date().getDate()

  const { data: daily } = await bot.db
    .from("adventWords")
    .select()
    .eq("day", dayOfMonth)
    .single()

  if (!daily) {
    return bot.logger.error(LOG_SCOPE, "Unable to find today's word.")
  }

  const { word } = daily

  const message = await bot.channels.advent.send(
    `:calendar_spiral: Howdy ${bot.roles.advent}! Today's word is: **${word}**`,
  )
  await message.pin()

  bot.logger.info(LOG_SCOPE, `Sent daily word ${word}`)
}
