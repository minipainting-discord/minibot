import { ApplicationCommandOptionType } from "discord.js"

export default function say(bot) {
  return {
    name: "say",
    description: "🔓 Make the bot say something",
    availability: bot.AVAILABILITY.MOD,
    options: [
      {
        name: "channel",
        description: "Where to send the message",
        type: ApplicationCommandOptionType.Channel,
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
      const channel = interaction.options.getChannel("channel")
      const message = interaction.options.getString("message")

      const sentMessage = await channel.send(message)

      await interaction.reply({ content: sentMessage.url, ephemeral: true })
    },
  }
}
