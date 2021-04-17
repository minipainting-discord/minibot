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
    bot.client.on("guildMemberAdd", (member) => onGuildMemberAdd(bot, member))
    bot.client.on("guildMemberUpdate", (oldMember, newMember) =>
      onGuildMemberUpdate(bot, oldMember, newMember),
    )
    bot.client.on("presenceUpdate", (oldPresence, newPresence) =>
      onPresenceUpdate(bot, oldPresence, newPresence),
    )
    bot.client.on("message", (member) => onMessage(bot, member))

    await updateMembers(bot, bot.guild.members.cache.array())
  },
}

async function onGuildMemberAdd(bot, member) {
  await updateMember(bot, member)
}

async function onGuildMemberUpdate(bot, oldMember, newMember) {
  await updateMember(bot, newMember)
}

async function onPresenceUpdate(bot, oldPresence, newPresence) {
  await updateMember(bot, newPresence.member)
}

async function onMessage(bot, message) {
  await updateMember(bot, message.author)
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
