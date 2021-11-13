import { MessageEmbed } from "discord.js"

import { Permission } from "./index.js"

export default {
  name: "ranks",
  description: "Show point system ranks",
  permissions: [Permission.PUBLIC],

  async execute(interaction, bot) {
    const { data: ranks } = await bot.db
      .from("ranks")
      .select()
      .order("minPoints", { ascending: true })

    const roles = await Promise.all(
      ranks.map(async (rank) => await bot.guild.roles.fetch(rank.roleId))
    )

    const embed = new MessageEmbed().setTitle("Ranks").addFields([
      { name: "Name", value: roles.join("\n"), inline: true },
      {
        name: "Min. points",
        value: ranks.map((r) => r.minPoints).join("\n"),
        inline: true,
      },
    ])

    await interaction.reply({ embeds: [embed] })
  },
}
