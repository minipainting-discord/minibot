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

    cron.schedule(
      parseSchedule("every day at 00:00 from 1 through 24 of december"),
      () => sayDailyWord(bot),
    )
  },
}

async function sayDailyWord(bot) {
  const dayOfMonth = new Date().getDate()
  const { word } = await bot.db.get(
    "SELECT word FROM adventWords WHERE day = ?",
    dayOfMonth,
  )

  await bot.channels.advent.send(`${bot.roles.advent} today's word is ${word}`)
}
