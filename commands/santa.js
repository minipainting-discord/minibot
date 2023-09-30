import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js"
import { updateDisplayName } from "../helpers/userbase.js"

export default function santa(bot) {
  return {
    name: "santa",
    description: "Take part in our annual Secret Santa!",
    availability: bot.AVAILABILITY.PUBLIC,

    async execute(interaction) {
      const guildMember = await bot.guild.members.fetch(interaction.user)
      await updateDisplayName(bot, guildMember)
      const { data: user } = await bot.db
        .from("users")
        .select()
        .single()
        .match({ userId: interaction.user.id })

      if (!user) {
        await bot.logger.error(`User not found ${user}`)
        return await interaction.reply({
          content: "Something went wrong, we've been warned",
          ephemeral: true,
        })
      }

      if (user.canParticipateInSecretSanta === false) {
        return await interaction.reply({
          content: "You are not allowed to participate in Secret Santa.",
          ephemeral: true,
        })
      }

      if (user.canParticipateInSecretSanta === null && user.rankId === null) {
        return await interaction.reply({
          content: [
            "You are not allowed to participate in Secret Santa yet.",
            "You need a rank or an explicit approval from the admin.",
          ].join("\n"),
          ephemeral: true,
        })
      }

      return await interaction.reply({
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
