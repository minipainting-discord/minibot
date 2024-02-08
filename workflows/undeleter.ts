import { ChannelType, Message, PartialMessage } from "discord.js"
import { Bot } from "../bot"

export default async function undeleter(bot: Bot) {
  bot.discord.on("messageDelete", onMessageDelete)

  async function onMessageDelete(message: Message | PartialMessage) {
    if (message.channel.type === ChannelType.DM) {
      return
    }

    bot.logger.info(
      "undeleter",
      `Message by ${message.author} deleted: ${message}`,
    )
  }
}
