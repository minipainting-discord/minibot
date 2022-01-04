import { addPoints } from "../helpers/points.js"

export default function addpoints(bot) {
  return {
    name: "addpoints",
    description: "🔓 Add points to an user",
    availability: bot.AVAILABILITY.MOD,
    options: [
      {
        name: "user",
        description: "The user to add points to",
        type: "USER",
        required: true,
      },
      {
        name: "points",
        description: "The amount of points to add",
        type: "INTEGER",
        required: true,
      },
    ],

    async execute(interaction) {
      const user = interaction.options.getUser("user")
      const points = interaction.options.getInteger("points")

      const guildMember = await bot.guild.members.fetch(user)
      const newScore = await addPoints(bot, guildMember, points)

      if (!newScore) {
        return interaction.reply(
          `💥 Error while adding points (I'm warning <@${bot.settings.botMasterId}>)`
        )
      }

      interaction.reply(
        `${user} now has ${newScore.lifetime} lifetime points and ${newScore.current} current points`
      )
      bot.events.emit(bot.EVENT.PLAYER_SCORE_UPDATE, {
        ...newScore,
        guildMember,
      })
    },
  }
}