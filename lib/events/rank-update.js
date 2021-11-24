import path from "path"

import { randomItem } from "../utils.js"

export default async (bot) => {
  const { data: RANK_UP_GIFS } = await bot.db.storage
    .from("images")
    .list("rank-up")

  const { data: RANK_DOWN_GIFS } = await bot.db.storage
    .from("images")
    .list("rank-down")

  bot.events.on(bot.EVENT.PLAYER_SCORE_UPDATE, async ({ user, lifetime }) => {
    const member = await bot.guild.members.fetch(user)
    const currentRank = bot.ranks.find((rank) =>
      member.roles.cache.has(rank.roleId)
    )
    const nextRank = [...bot.ranks]
      .reverse()
      .find((rank) => lifetime >= rank.minPoints)

    if (currentRank === nextRank) {
      return
    }

    if (currentRank) {
      await member.roles.remove(currentRank.role)
    }

    if (nextRank) {
      await member.roles.add(nextRank.role)
    }

    const { message, gifUrl } = await getRankingMessage(currentRank, nextRank)

    bot.logger.info(
      `[rank-update] ${member.displayName} ${member} ${
        currentRank?.name || "No rank"
      } -> ${nextRank?.name || "No rank"}`
    )

    await bot.channels.general.send({
      content: `${member} ${message}`,
      files: [gifUrl],
    })
  })

  async function getRankingMessage(currentRank, nextRank) {
    if (currentRank && !nextRank) {
      return {
        message: `SKREEEOONK!!! ANNIHILATED`,
        gifUrl: await getRandomGifUrl("rank-down", RANK_DOWN_GIFS),
      }
    }

    return !currentRank || currentRank.minPoints < nextRank.minPoints
      ? {
          message: `:confetti_ball: Congratulations you reached the **${nextRank.role.name}** rank! :confetti_ball:`,
          gifUrl: await getRandomGifUrl("rank-up", RANK_UP_GIFS),
        }
      : {
          message: `SSKREEEOONK!!! DEMOTED TO **${nextRank.role.name}**`,
          gifUrl: await getRandomGifUrl("rank-down", RANK_DOWN_GIFS),
        }
  }

  async function getRandomGifUrl(prefix, gifs) {
    const { publicURL } = await bot.db.storage
      .from("images")
      .getPublicUrl(path.join(prefix, randomItem(gifs).name))

    return publicURL
  }
}
