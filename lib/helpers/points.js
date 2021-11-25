import { getCurrentYear } from "../utils.js"

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
