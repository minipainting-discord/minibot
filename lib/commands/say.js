export default {
  name: "say",
  description: "Make the bot say something",
  options: [
    {
      name: "channel",
      description: "Where to send the message",
      type: "CHANNEL",
      required: true,
    },
    {
      name: "message",
      description: "What to say",
      type: "STRING",
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
