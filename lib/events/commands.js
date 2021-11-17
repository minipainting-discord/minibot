export default (bot) =>
  bot.discord.on("interactionCreate", async (interaction) => {
    const { commands } = bot

    if (interaction.isCommand() && commands.has(interaction.commandName)) {
      try {
        await commands.get(interaction.commandName).execute(interaction, bot)
        bot.logger.info(
          `${interaction.member.displayName} ${interaction.member} used ${interaction}`
        )
      } catch (error) {
        if (error instanceof bot.PermissionError) {
          bot.logger.warn(
            `${interaction.member.displayName} ${interaction.member} tried using ${interaction} with insufficient privileges`
          )
          return interaction.reply({
            content: "Ehhhh I can't let you do that!",
            ephemeral: true,
          })
        }

        bot.logger.error(`Error while executing ${error.commandName}`, error)
      }
    }
  })
