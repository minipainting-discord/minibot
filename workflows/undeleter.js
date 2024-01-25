import { ChannelType } from "discord.js"

export default async function undeleter(bot) {
  bot.discord.on("messageDelete", onMessageDelete)

  async function onMessageDelete(message) {
    if (message.channel.type === ChannelType.DM) {
      return
    }

    bot.logger.info(
      "undeleter",
      `Message by ${message.author} deleted: ${message}`,
    )
  }
}
