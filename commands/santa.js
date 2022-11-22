import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js"

export default function santa(bot) {
  return {
    name: "santa",
    description: "Take part in our annual Secret Santa!",
    availability: bot.AVAILABILITY.PUBLIC,

    async execute(interaction) {
      await interaction.reply({
        components: [
          new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setCustomId("join-secret-santa")
              .setLabel("Join the Secret Santa!")
              .setStyle(ButtonStyle.Primary)
          ),
        ],
        ephemeral: true,
      })
    },
  }
}
