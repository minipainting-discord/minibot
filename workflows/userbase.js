import { isBefore, subWeeks } from "date-fns"
import { complete } from "../helpers/partials.js"
import { updateDisplayName } from "../helpers/userbase.js"

export default async function userbase(bot) {
  bot.discord.on("guildMemberAdd", onGuildMemberAdd)
  bot.discord.on("guildMemberUpdate", onGuildMemberUpdate)

  async function onGuildMemberAdd(guildMember) {
    await complete(guildMember)
    bot.logger.info("userbase", `New member: ${guildMember.displayName}`)
    await updateDisplayName(bot, guildMember)

    if (isSuspiciousUser(guildMember)) {
      bot.logger.moderation(
        "userbase",
        `Suspicious new member: ${guildMember.displayName}`,
      )
    }
  }

  async function onGuildMemberUpdate(oldGuildMember, newGuildMember) {
    await complete(oldGuildMember, newGuildMember)

    if (oldGuildMember.displayName === newGuildMember.displayName) {
      return
    }

    bot.logger.info(
      "userbase",
      `Rename ${oldGuildMember.displayName} to ${newGuildMember.displayName}`,
    )

    await updateDisplayName(bot, newGuildMember)
  }
}

function isSuspiciousUser(guildMember) {
  const { user } = guildMember

  const now = new Date()
  const isAtLeastOneWeekOld = isBefore(user.createdAt, subWeeks(now, 1))
  const isSystemUser = user.system

  if (isAtLeastOneWeekOld || isSystemUser) {
    return false
  }

  return true
}
