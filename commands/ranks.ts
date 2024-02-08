import { createEmbed } from "../utils.js"
import { BotCommandBuilder } from "./index.js"

const command: BotCommandBuilder = function ranks(bot) {
  return {
    name: "ranks",
    description: "Show point system ranks",
    availability: bot.AVAILABILITY.PUBLIC,

    async execute(interaction) {
      const { ranks } = bot

      const maxPointsDigits = Math.floor(
        1 + Math.log10(ranks.at(-1)?.minPoints || 0),
      )

      const embed = createEmbed({
        title: "Ranks",
        description: ranks
          .map((rank) =>
            [
              ` \`${String(rank.minPoints).padStart(maxPointsDigits)}\` `,
              rank.role,
            ].join(" "),
          )
          .join("\n"),
      })

      await interaction.reply({ embeds: [embed] })
    },
  }
}

export default command
