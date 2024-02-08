import { ApplicationCommandOptionType, ChannelType } from "discord.js"
import { BotCommandBuilder } from "."

const command: BotCommandBuilder = function say(bot) {
  return {
    name: "say",
    description: "🔓 Make the bot say something",
    availability: bot.AVAILABILITY.MOD,
    options: [
      {
        name: "channel",
        description: "Where to send the message",
        type: ApplicationCommandOptionType.Channel,
        channelTypes: [ChannelType.GuildText],
        required: true,
      },
      {
        name: "message",
        description: "What to say",
        type: ApplicationCommandOptionType.String,
        required: true,
      },
    ],

    async execute(interaction) {
      const channel = interaction.options.getChannel("channel", true, [
        ChannelType.GuildText,
      ])
      const message = interaction.options.getString("message", true)

      const sentMessage = await channel.send(message)

      await interaction.reply({ content: sentMessage.url, ephemeral: true })
    },
  }
}

export default command
