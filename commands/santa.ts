import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js"
import { updateDisplayName } from "../helpers/updateDisplayName"
import { BotCommandBuilder } from "."
import { getUserById } from "../models/User"

const LOG_SCOPE = "commands/santa"

const command: BotCommandBuilder = function santa(bot) {
  return {
    name: "santa",
    description: "Take part in our annual Secret Santa!",
    availability: bot.AVAILABILITY.PUBLIC,

    async execute(interaction) {
      const guildMember = await bot.guild.members.fetch(interaction.user)
      await updateDisplayName(bot, guildMember)
      const user = await getUserById(bot.db, interaction.user.id)

      if (!user) {
        bot.logger.error(LOG_SCOPE, `User not found ${user}`)
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
          new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder()
              .setCustomId("join-secret-santa")
              .setLabel("Join the Secret Santa!")
              .setStyle(ButtonStyle.Primary),
          ),
        ],
        ephemeral: true,
      })
    },
  }
}

export default command
