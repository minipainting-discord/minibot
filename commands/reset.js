module.exports = {
  keyword: "reset",
  helpMod: true,
  help: "`!reset`: Restart the bot",
  execute: (bot, message) => {
    if (
      !message.member.roles.has(bot.roles.admin.id) &&
      !message.member.roles.has(bot.roles.mod.id)
    ) {
      message.reply(`Nope ${bot.emojis.LUL}`)
      return
    }

    message.reply("Coming back!")

    setTimeout(() => process.exit(), 1000)
  },
}
