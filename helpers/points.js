import { getCurrentYear } from "../utils.js"

export async function addPoints(bot, guildMember, points) {
  const userId = guildMember.id
  const year = getCurrentYear()

  const currentScore = await getCurrentScore(bot, guildMember)
  const lifetimeScore = await getLifetimeScore(bot, guildMember)

  const newScore = {
    current: (currentScore?.points || 0) + points,
    lifetime: (lifetimeScore?.points || 0) + points,
  }

  const { error } = await bot.db
    .from("leaderboard")
    .upsert({ userId, year, points: newScore.current })

  if (error) {
    bot.logger.error("helper/addPoints", "Error while adding points", error)
    return null
  }

  const { error: userUpdateError } = await bot.db
    .from("users")
    .upsert({ userId, displayName: guildMember.displayName })

  if (userUpdateError) {
    bot.logger.error(
      "helper/addPoints",
      "Error while updating user",
      userUpdateError
    )
  }

  bot.events.emit(bot.EVENT.PLAYER_SCORE_UPDATE, {
    ...newScore,
    guildMember,
  })

  return newScore
}

export async function getCurrentScore(bot, user) {
  const { data: currentScore } = await bot.db
    .from("leaderboard")
    .select()
    .single()
    .match({ userId: user.id, year: getCurrentYear() })

  return currentScore
}

export async function getLifetimeScore(bot, user) {
  const { data: lifetimeScore } = await bot.db
    .from("lifetime")
    .select()
    .single()
    .match({ userId: user.id })

  return lifetimeScore
}
