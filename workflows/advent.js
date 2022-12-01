import cron from "node-cron"
import parseSchedule from "friendly-node-cron"

export default async function advent(bot) {
  cron.schedule(
    parseSchedule("every day at 00:00 from 1 through 24 of december"),
    () => sayDailyWord(bot),
    {
      timezone: "America/Los_Angeles",
    }
  )
}

async function sayDailyWord(bot) {
  const dayOfMonth = new Date().getDate()

  const { data: daily } = await bot.db
    .from("adventWords")
    .select()
    .eq("day", dayOfMonth)
    .single()
  const { word } = daily

  const message = await bot.channels.advent.send(
    `:calendar_spiral: Howdy ${bot.roles.advent}! Today's word is: **${word}**`
  )
  await message.pin()

  bot.logger.info("workflows/advent", `Sent daily word ${word}`)
}
