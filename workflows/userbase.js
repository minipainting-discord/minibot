import { complete } from "../helpers/partials.js"

export default async function userbase(bot) {
  bot.discord.on("guildMemberAdd", onGuildMemberAdd)
  bot.discord.on("guildMemberUpdate", onGuildMemberUpdate)

  async function onGuildMemberAdd(guildMember) {
    await complete(guildMember)
    bot.logger.info("userbase", `New member: ${guildMember.displayName}`)
    await updateDisplayNames(guildMember)
  }

  async function onGuildMemberUpdate(oldGuildMember, newGuildMember) {
    await complete(oldGuildMember, newGuildMember)

    if (oldGuildMember.displayName === newGuildMember.displayName) {
      return
    }

    bot.logger.info(
      "userbase",
      `Rename ${oldGuildMember.displayName} to ${newGuildMember.displayName}`
    )

    await updateDisplayNames(newGuildMember)
  }

  async function updateDisplayNames(guildMember) {
    await bot.db.from("users").upsert({
      userId: guildMember.id,
      displayName: guildMember.displayName,
    })
  }
}
