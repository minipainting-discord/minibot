// TODO: This mess should be cleaned up

const USAGE = "`!resetpoints USER`"

module.exports = {
  name: "resetpoints",
  commands: [
    {
      keyword: "resetpoints",
      help: `${USAGE}: Reset an user's points to ZERO`,
      helpMod: true,
      execute: resetpoints,
    },
  ],
}

function resetpoints(bot, message, ...args) {
  if (!bot.fromModerator(message)) {
    return
  }

  const user = message.mentions.users.first()

  if (args.length < 1 || !user) {
    message.reply(USAGE)
    return
  }

  const zero = 0

  message.guild.fetchMember(user).then(member => {
    const roles = bot.settings.ranks.map(rank =>
      message.guild.roles.find(role => role.name === rank.name),
    )

    for (const role of roles) {
      if (role !== null && member.roles.has(role.id)) {
        member.removeRole(role).catch(bot.logError)
      }
    }

    bot.db.get(`SELECT * FROM scores WHERE userId ='${user.id}'`).then(row => {
      if (!row) {
        bot.db.run(
          "INSERT INTO scores (userId, points, level) VALUES (?, ?, ?)",
          [user.id, zero, 0],
        )
      } else {
        bot.db
          .run(
            `UPDATE scores SET points = ${zero}, level = ${zero} WHERE userId = ${user.id}`,
          )
          .then(() => {
            bot.db.run(`DELETE FROM annual WHERE userId = ${user.id}`)
          })
      }
      message.reply(user + ` reset to 0 points`)
      return
    })
  })
}
