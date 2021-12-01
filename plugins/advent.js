const cron = require("node-cron")
const parseSchedule = require("friendly-node-cron")

module.exports = {
  name: "advent",

  setup: async (bot) => {
    bot.db.run(
      `CREATE TABLE IF NOT EXISTS adventWords (
        day  INTEGER,
        word TEXT,
        PRIMARY KEY (day)
      )`,
    )
  },

  onReady: async (bot) => {
    cron.schedule(
      parseSchedule("every day at 00:00 from 1 through 24 of december"),
      () => sayDailyWord(bot),
      {
        timezone: "America/Los_Angeles",
      },
    )
  },
}

async function sayDailyWord(bot) {
  const dayOfMonth = new Date().getDate()
  const { word } = await bot.db.get(
    "SELECT word FROM adventWords WHERE day = ?",
    dayOfMonth,
  )

  const message = await bot.channels.advent.send(
    `:calendar_spiral: Howdy ${bot.roles.advent}! Today's word is: **${word}**`,
  )
  await message.pin()
  bot.log("[advent] Sent daily word")
}
