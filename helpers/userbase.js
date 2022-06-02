export async function updateDisplayName(bot, guildMember) {
  await bot.db.from("users").upsert({
    userId: guildMember.id,
    displayName: guildMember.displayName,
  })
}
