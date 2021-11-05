module.exports = {
  name: "userbase",

  setup: async (bot) => {
    await bot.db.run(
      `CREATE TABLE IF NOT EXISTS users (
         userId TEXT PRIMARY KEY,
         displayName TEXT
       )`,
    )
  },

  async onReady(bot) {
    async function onGuildMemberAdd(member) {
      try {
        await updateMember(bot, member)
      } catch (err) {
        bot.logError(
          err,
          "Unable to update member from guild member add",
          member,
        )
      }
    }

    async function onGuildMemberUpdate(oldMember, newMember) {
      try {
        await updateMember(bot, newMember)
      } catch (err) {
        bot.logError(
          err,
          "Unable to update member from guild member update",
          newMember,
        )
      }
    }

    async function onPresenceUpdate(oldPresence, newPresence) {
      if (!newPresence.member) {
        return
      }

      try {
        await updateMember(bot, newPresence.member)
      } catch (err) {
        bot.logError(err, "Unable to update member from presence", newPresence)
      }
    }

    async function onMessage(message) {
      if (!message.guild) {
        return
      }

      try {
        await updateMember(bot, message.member)
      } catch (err) {
        bot.logError(err, "Unable to update member from message", message)
      }
    }

    bot.client.on("guildMemberAdd", onGuildMemberAdd)
    bot.client.on("guildMemberUpdate", onGuildMemberUpdate)
    bot.client.on("presenceUpdate", onPresenceUpdate)
    bot.client.on("message", onMessage)

    await updateMembers(bot, bot.guild.members.cache.array())
  },
}

async function updateMember(bot, member) {
  await bot.db.run(
    `
    INSERT INTO users (userId, displayName) VALUES (?, ?)
    ON CONFLICT(userId) DO UPDATE SET displayName=excluded.displayName
  `,
    [member.id, member.displayName],
  )
}

async function updateMembers(bot, members) {
  const placeholders = Array.from(members, () => "(?, ?)").join(", ")
  const replacements = Array.from(members, (m) => [m.id, m.displayName]).flat()

  await bot.db.run(
    `
    INSERT INTO users (userId, displayName) VALUES ${placeholders}
    ON CONFLICT(userId) DO UPDATE SET displayName=excluded.displayName
  `,
    replacements,
  )
}
