export async function addPoints(bot, guildMember, points, year) {
  const userId = guildMember.id

  const yearScore = await getYearScore(bot, guildMember, year)
  const lifetimeScore = await getLifetimeScore(bot, guildMember)

  const newScore = {
    year: (yearScore?.points || 0) + points,
    lifetime: (lifetimeScore?.points || 0) + points,
  }

  const { error } = await bot.db
    .from("leaderboard")
    .upsert({ userId, year, points: newScore.year })

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
      userUpdateError,
    )
  }

  bot.events.emit(bot.EVENT.USER_POINTS_UPDATE, {
    ...newScore,
    guildMember,
  })

  return newScore
}

export async function getYearScore(bot, user, year) {
  const { data: yearScore } = await bot.db
    .from("leaderboard")
    .select()
    .single()
    .match({ userId: user.id, year })

  return yearScore
}

export async function getLifetimeScore(bot, user) {
  const { data: lifetimeScore } = await bot.db
    .from("lifetime")
    .select()
    .single()
    .match({ userId: user.id })

  return lifetimeScore
}
