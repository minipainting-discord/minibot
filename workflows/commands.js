export default async function commands(bot) {
  bot.discord.on("interactionCreate", async (interaction) => {
    const { commands } = bot

    if (interaction.isCommand() && commands.has(interaction.commandName)) {
      const command = commands.get(interaction.commandName)
      try {
        await command.execute(interaction)
        bot.logger.info(
          "commands",
          `${interaction.member} (${interaction.user.username}) used **${interaction}** in ${interaction.channel}`,
        )
      } catch (error) {
        bot.logger.error(
          "commands",
          `Error while executing ${command.name}`,
          error,
        )
      }
    }
  })
}
