import { ApplicationCommandOptionType } from "discord.js"
import { addPoints } from "../helpers/addPoints"
import { updateDisplayName } from "../helpers/updateDisplayName"
import { getCurrentYear } from "../utils"
import type { BotCommandBuilder } from "./"

const command: BotCommandBuilder = function addpoints(bot) {
  return {
    name: "addpoints",
    description: "🔓 Add points to an user",
    availability: bot.AVAILABILITY.MOD,
    options: [
      {
        name: "user",
        description: "The user to add points to",
        type: ApplicationCommandOptionType.User,
        required: true,
      },
      {
        name: "points",
        description: "The amount of points to add",
        type: ApplicationCommandOptionType.Integer,
        required: true,
      },
      {
        name: "year",
        description: "The year of points to add (defaults to current year)",
        type: ApplicationCommandOptionType.Integer,
      },
    ],

    async execute(interaction) {
      const user = interaction.options.getUser("user", true)
      const points = interaction.options.getInteger("points", true)
      const year = interaction.options.getInteger("year") ?? getCurrentYear()

      const guildMember = await bot.guild.members.fetch(user)

      // Make sure the member is in userbase
      await updateDisplayName(bot, guildMember)
      const pointUpdate = await addPoints(bot, guildMember, points, year)

      if (!pointUpdate) {
        return await interaction.reply(
          `💥 Error while adding points (I'm warning <@${bot.env.BOT_MASTER_ID}>)`,
        )
      }

      await interaction.reply(
        `${user} now has ${pointUpdate.lifetime} lifetime points and ${pointUpdate.year} points for ${year}`,
      )
    },
  }
}

export default command
