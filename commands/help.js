const settings = require("../settings.json")

module.exports = {
  keyword: "help",
  help: "`!help`: You're looking at it!",
  availableInDM: true,
  execute: (bot, message) => {
    const onModChannel = message.channel.id === settings.channels.mod

    const visibleCommands = bot.commands.filter(command => {
      if (!command.help) {
        return false
      }

      if (command.mod || command.helpMod) {
        return onModChannel
      }

      if (message.channel.type === "dm" && !command.availableInDM) {
        return false
      }

      return true
    })

    function showCommandHelp(command) {
      return Array.isArray(command.help)
        ? command.help.map(help => showCommandHelp({ help })).join("\n")
        : `- ${command.help}`
    }

    const reply = [
      "**COMMAND LIST**",
      ...visibleCommands.filter(c => !c.mod && !c.helpMod).map(showCommandHelp),
      onModChannel ? "\n**MOD ONLY**" : null,
      ...visibleCommands.filter(c => c.mod || c.helpMod).map(showCommandHelp),
    ].join("\n")

    message.reply(reply)
  },
}
