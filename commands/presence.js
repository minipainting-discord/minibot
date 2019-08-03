const USAGE = "`!presence ACTIVITY VALUE`"

const ACTIVITIES = ["playing", "streaming", "listening", "watching"]

module.exports = {
  keyword: "presence",
  mod: true,
  help: `${USAGE}: Set the bot presence message`,
  execute: (bot, message, activity, ...words) => {
    if (
      !message.member.roles.has(bot.roles.admin.id) &&
      !message.member.roles.has(bot.roles.mod.id)
    ) {
      message.reply(`Nope ${bot.emojis.LUL}`)
      return
    }

    if (!activity || !words || !words.length) {
      message.reply(USAGE)
      return
    }

    if (!ACTIVITIES.includes(activity)) {
      message.reply(
        "Activity must be one of playing, streaming, listening or watching",
      )
    }

    bot.client.user.setPresence({
      game: { name: words.join(" "), type: activity.toUpperCase() },
    })
  },
}
