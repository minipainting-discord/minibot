import { GuildMember } from "discord.js"
import { Bot } from "../bot"
import { updateDisplayName } from "./updateDisplayName"
import { getYearScore, getLifetimeScore, updateScore } from "../models/Score"

const LOG_SCOPE = "helpers/addPoints"

type PointUpdate = {
  year: number
  lifetime: number
}

async function addPoints(
  bot: Bot,
  guildMember: GuildMember,
  points: number,
  year: number,
): Promise<PointUpdate | void> {
  await updateDisplayName(bot, guildMember)

  const userId = guildMember.id
  const yearScore = await getYearScore(bot.db, userId, year)
  const lifetimeScore = await getLifetimeScore(bot.db, userId)

  const pointUpdate = {
    year: yearScore?.points + points,
    lifetime: lifetimeScore?.points + points,
  }

  try {
    await updateScore(bot.db, userId, pointUpdate.year, year)
  } catch (error) {
    return bot.logger.error(LOG_SCOPE, "Error while adding points", error)
  }

  bot.events.emit(bot.EVENT.USER_POINTS_UPDATE, {
    guildMember,
    ...pointUpdate,
  })

  return pointUpdate
}

export { addPoints }
export type { PointUpdate }
