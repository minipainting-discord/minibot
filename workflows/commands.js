export default async function commands(bot) {
  bot.discord.on("interactionCreate", async (interaction) => {
    const { commands } = bot

    if (interaction.isCommand() && commands.has(interaction.commandName)) {
      try {
        await commands.get(interaction.commandName).execute(interaction)
        bot.logger.info(
          "commands",
          `${interaction.member.displayName} ${interaction.member} used ${interaction}`
        )
      } catch (error) {
        bot.logger.error(
          "commands",
          `Error while executing ${error.commandName}`,
          error
        )
      }
    }
  })
}
