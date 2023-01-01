import { ApplicationCommandOptionType } from "discord.js"
import { addPoints } from "../helpers/points.js"
import { updateDisplayName } from "../helpers/userbase.js"
import { getCurrentYear } from "../utils.js"

export default function addpoints(bot) {
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
      const user = interaction.options.getUser("user")
      const points = interaction.options.getInteger("points")
      const year = interaction.options.getInteger("year") ?? getCurrentYear()

      const guildMember = await bot.guild.members.fetch(user)

      // Make sure the member is in userbase
      await updateDisplayName(bot, guildMember)
      const newScore = await addPoints(bot, guildMember, points, year)

      if (!newScore) {
        return await interaction.reply(
          `💥 Error while adding points (I'm warning <@${bot.settings.botMasterId}>)`
        )
      }

      await interaction.reply(
        `${user} now has ${newScore.lifetime} lifetime points and ${newScore.current} current points`
      )
    },
  }
}
