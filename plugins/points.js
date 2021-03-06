module.exports = {
  name: "points",
  setup: (bot) =>
    bot.db.run(
      "CREATE TABLE IF NOT EXISTS scores (userId TEXT, points INTEGER, level INTEGER)",
    ),
  commands: [
    {
      keyword: "points",
      help: "`!points [USER]`: Check a user's points",
      execute: points,
    },
  ],
}

function points(bot, message) {
  const user =
    message.mentions.users.size > 0
      ? message.mentions.users.first()
      : message.author
  const toSelf = user === message.author

  bot.db
    .get(
      `SELECT s.points AS s_points, ifnull(a.points, 0) AS a_points FROM scores s LEFT JOIN annual a ON s.userId = a.userId WHERE s.userId ='${user.id}'`,
    )
    .then((row) => {
      if (!row) {
        message.reply(`${toSelf ? "you have" : `${user} has`} 0 points`)
        return
      }

      message.reply(
        `${toSelf ? "you have" : `${user} has`} ${row.s_points} lifetime point${
          row.s_points !== 1 ? "s" : ""
        } and ${row.a_points} current point${row.a_points !== 1 ? "s" : ""}`,
      )
    })
    .catch((err) => {
      bot.logError(err)
      message.reply("Oops, something went wrong!")
    })
}
