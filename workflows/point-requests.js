import { MessageActionRow, MessageButton } from "discord.js"

import { pluralize, removeReaction } from "../utils.js"
import { addPoints } from "../helpers/points.js"
import {
  listPendingPointRequests,
  getPointRequestFromThread,
  createPointRequest,
  updatePointRequest,
} from "../helpers/point-requests.js"

const BUTTONS = [
  { customId: "plus-one", label: "Add 1", style: "PRIMARY" },
  { customId: "plus-two", label: "Add 2", style: "PRIMARY" },
  { customId: "reject", label: "Close", style: "DANGER" },
]

export default async function pointRequests(bot) {
  const requestCollector = bot.channels.points.createMessageCollector({
    filter: (message) =>
      message.attachments.size > 0 && message.mentions.has(bot.roles.mod),
  })

  requestCollector.on("collect", (message) => openPointRequest(bot, message))

  bot.discord.on("threadUpdate", (oldThread, newThread) =>
    handleThreadUpdate(bot, oldThread, newThread)
  )

  await resumePendingRequests(bot)
}

async function openPointRequest(bot, message) {
  const guildMember = await bot.guild.members.fetch(message.author)
  const pointRequest = await createPointRequest(bot, message)
  const thread = await message.startThread({
    name: `Request by ${guildMember.displayName}`,
  })
  const actionMessage = await thread.send({
    content: [
      "Thanks for submitting! A moderator will look at your request shortly.",
      "Moderators, enter the amount of points to give  (0 to reject the request) or use one of the quick actions below:",
    ].join("\n"),
    components: [
      new MessageActionRow({
        components: BUTTONS.map((button) => new MessageButton(button)),
      }),
    ],
  })

  await updatePointRequest(bot, pointRequest, {
    actionMessageId: actionMessage.id,
  })

  await startPointRequestWatcher(bot, pointRequest, actionMessage)
}

async function handleThreadUpdate(bot, oldThread, newThread) {
  if (oldThread.parentId !== bot.channels.points.id) {
    return
  }

  const pointRequest = await getPointRequestFromThread(bot, oldThread)

  if (!pointRequest) {
    return
  }

  if (oldThread.archived && !newThread.archived) {
    bot.logger.info(
      "workflow/point-requests",
      `Reopening point request ${pointRequest.id}`
    )
    await newThread.send("Point request reopened!")
    await updatePointRequest(bot, pointRequest, { cleared: false })
    await startPointRequestWatcher(bot, pointRequest)
  }
}

async function resumePendingRequests(bot) {
  const pendingPointRequests = await listPendingPointRequests(bot)
  const pendingCount = pendingPointRequests.length

  if (pendingCount) {
    bot.logger.info(
      "workflow/point-requests",
      `Resuming tracking for ${pendingCount} point ${pluralize(
        "request",
        pendingCount
      )}`
    )
    for (const pointRequest of pendingPointRequests) {
      await startPointRequestWatcher(bot, pointRequest)
    }
  }
}

async function startPointRequestWatcher(
  bot,
  pointRequest,
  knownActionMessage = null
) {
  const user = await bot.discord.users.fetch(pointRequest.userId)
  const guildMember = await bot.guild.members.fetch(user)
  const requestMessage = await bot.channels.points.messages.fetch(
    pointRequest.requestMessageId
  )
  const actionMessage =
    knownActionMessage ??
    (await requestMessage.thread.messages.fetch(pointRequest.actionMessageId))
  const messageCollector = requestMessage.thread.createMessageCollector({
    filter: async (message) => {
      const guildMember = await bot.guild.members.fetch(message.author)
      return bot.isModerator(guildMember) && message.content.match(/^-?\d+$/)
    },
  })
  const buttonCollector = actionMessage.createMessageComponentCollector({
    componentType: "BUTTON",
  })

  await removeReaction(requestMessage, "✅")
  await requestMessage.react("👀")

  async function resolveRequest(points) {
    if (points !== 0) {
      const newScore = await addPoints(bot, guildMember, points)

      await requestMessage.thread.send(
        `${user} now has ${newScore.lifetime} lifetime points and ${newScore.current} current points`
      )
    }
    await requestMessage.thread.send(
      "This request is now cleared. If you feel like you're not being given the right amount of points please ping a moderator below and they will settle it."
    )

    await removeReaction(requestMessage, "👀")
    await requestMessage.react("✅")
    await requestMessage.thread.setArchived(true, "Points given")
    await requestMessage.thread.setLocked(false)
    await updatePointRequest(bot, pointRequest, { cleared: true })
    messageCollector.stop()
    buttonCollector.stop()
    bot.logger.info(
      "workflow/point-requests",
      `Closed point request ${pointRequest.id}`
    )
  }

  messageCollector.on("collect", async (message) =>
    handleModeratorInput(bot, message, resolveRequest)
  )

  buttonCollector.on("collect", async (interaction) =>
    handleButtonInteraction(bot, interaction, resolveRequest)
  )
}

async function handleModeratorInput(bot, message, resolveRequest) {
  const points = parseInt(message.content, 10)

  await resolveRequest(points)
}

async function handleButtonInteraction(bot, interaction, resolveRequest) {
  if (!bot.isModerator(interaction.member)) {
    return interaction.reply(`${bot.emojis.LUL} well tried!`)
  }

  switch (interaction.customId) {
    case "plus-one":
      await interaction.reply("Added 1 point")
      await resolveRequest(1)
      break
    case "plus-two":
      await interaction.reply("Added 2 points")
      await resolveRequest(2)
      break
    case "reject":
      await interaction.reply("Request rejected")
      await resolveRequest(0)
      break
  }
}
