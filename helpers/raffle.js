export async function addUserToRaffle(bot, guildMember) {
  const userId = guildMember.id
  const { error } = await bot.db.from("raffle").upsert({ userId })

  if (error) {
    bot.logger.error(
      "helper/raffle",
      `Error while adding user ${guildMember} to raffle`,
      error,
    )
    return false
  }

  return true
}

export async function removeUserFromRaffle(bot, guildMember) {
  const userId = guildMember.id
  const { error } = await bot.db.from("raffle").delete().eq("userId", userId)

  if (error) {
    bot.logger.error(
      "helper/raffle",
      `Error while removing user ${guildMember} from raffle`,
      error,
    )
    return false
  }

  return true
}

export async function isUserInRaffle(bot, guildMember) {
  const userId = guildMember.id
  const { data } = await bot.db
    .from("raffle")
    .select()
    .single()
    .match({ userId })

  return Boolean(data)
}
