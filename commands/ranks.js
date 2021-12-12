import { createEmbed } from "../utils.js"

export default function ranks(bot) {
  return {
    name: "ranks",
    description: "Show point system ranks",
    availability: bot.AVAILABILITY.PUBLIC,

    async execute(interaction) {
      const { ranks } = bot

      const maxPointsDigits = Math.floor(
        1 + Math.log10(ranks[ranks.length - 1].minPoints)
      )

      const embed = createEmbed({
        title: "Ranks",
        description: ranks
          .map((rank) =>
            [
              ` \`${String(rank.minPoints).padStart(maxPointsDigits)}\` `,
              rank.role,
            ].join(" ")
          )
          .join("\n"),
      })

      await interaction.reply({ embeds: [embed] })
    },
  }
}
