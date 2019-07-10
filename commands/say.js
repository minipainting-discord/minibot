const USAGE = "`!say channel something`"

module.exports = {
  keyword: "say",
  mod: true,
  help: `${USAGE}: Say something in a channel`,
  execute: (bot, message) => {
    if (
      !message.member.roles.has(bot.roles.admin.id) &&
      !message.member.roles.has(bot.roles.mod.id)
    ) {
      message.reply(`Nope ${bot.emojis.LUL}`)
      return
    }

    const channel = message.mentions.channels.first()

    const text = message.content
      .split(/ +/)
      .slice(2)
      .join(" ")

    if (!channel || !text.length) {
      message.reply(USAGE)
      return
    }

    channel.send(text)
  },
}
