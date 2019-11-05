module.exports = {
  name: "help",
  commands: [
    {
      keyword: "help",
      help: "`!help`: You're looking at it!",
      availableInDM: true,
      execute: help,
    },
  ],
}

function help(bot, message) {
  const onModChannel = message.channel.id === bot.settings.channels.mod

  const visibleCommands = bot.commands.filter(command => {
    if (!command.help) {
      return false
    }

    if (message.channel.type === "dm") {
      if (!command.availableInDM) {
        return false
      }

      if (command.mod || command.helpMod) {
        return bot.fromModerator(message)
      }
      return true
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

  const modHeader =
    (message.channel.type === "dm" && bot.fromModerator(message)) ||
    onModChannel
      ? "\n**MOD ONLY**"
      : null

  const reply = [
    "**COMMAND LIST**",
    ...visibleCommands.filter(c => !c.mod && !c.helpMod).map(showCommandHelp),
    modHeader,
    ...visibleCommands.filter(c => c.mod || c.helpMod).map(showCommandHelp),
  ].join("\n")

  message.reply(`\n>>> ${reply}`)
}
