import { getCurrentYear } from "../utils.js"

export async function addPoints(bot, user, points) {
  const userId = user.id
  const year = getCurrentYear()

  const currentScore = await getCurrentScore(bot, user)
  const lifetimeScore = await getLifetimeScore(bot, user)

  const newScore = {
    current: (currentScore?.points || 0) + points,
    lifetime: (lifetimeScore?.points || 0) + points,
  }

  const { error } = await bot.db
    .from("leaderboard")
    .upsert({ userId, year, points: newScore.current })

  if (error) {
    bot.logger.error(`[helpers/addPoints] Error while adding points`, error)
    return null
  }

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
