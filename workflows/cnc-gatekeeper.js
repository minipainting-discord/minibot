export default async function cncGatekeeper(bot) {
  const cncRulesMessage = await bot.channels.critique.messages.fetch(
    bot.settings.cncRulesMessageId
  )

  bot.events.on(bot.EVENT.PLAYER_SCORE_UPDATE, ({ guildMember, lifetime }) => {
    setImmediate(async () => {
      if (lifetime < bot.settings.minCncPoints) {
        return
      }

      if (guildMember.roles.cache.has(bot.roles.cnc.id)) {
        return
      }

      // Add the CNC role to the member
      await guildMember.roles.add(bot.roles.cnc)

      // Send instructions via DM
      const dmChannel = await guildMember.createDM()
      const messages = [
        `Hello, you just unlocked access to the ${bot.channels.critique} channel on the minipainting server. Below is a copy of the rules for that channel.`,
        ">>> " + cncRulesMessage.content,
        `_Read the rules on the server: ${cncRulesMessage.url}_`,
      ]
      for (const message of messages) {
        await dmChannel.send(message)
      }
    })
  })
}
