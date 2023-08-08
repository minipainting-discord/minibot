export default async function undeleter(bot) {
  bot.discord.on("messageDelete", onMessageDelete)

  async function onMessageDelete(message) {
    bot.logger.info(
      "undeleter",
      `Message by ${message.author} deleted: ${message}`
    )
  }
}
