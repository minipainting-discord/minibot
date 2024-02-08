import {
  ApplicationCommandOptionType,
  ChatInputCommandInteraction,
} from "discord.js"
import {
  addUserToRaffle,
  isUserInRaffle,
  removeUserFromRaffle,
} from "../models/Raffle"
import { getPreviousYear, pluralize } from "../utils"
import { Bot } from "../bot"
import { BotCommandBuilder } from "./"
import { getYearScore } from "../models/Score"

const LOG_SCOPE = "commands/raffle"
const POINTS_PER_ENTRY = 20

const command: BotCommandBuilder = function raffle(bot) {
  return {
    name: "raffle",
    description: "Manage your participation to the yearly raffle",
    availability: bot.AVAILABILITY.PUBLIC,
    options: [
      {
        name: "status",
        description: "Tell if you are participating or not",
        type: ApplicationCommandOptionType.Subcommand,
      },
      {
        name: "join",
        description: "Participate in the yearly raffle",
        type: ApplicationCommandOptionType.Subcommand,
      },
      {
        name: "leave",
        description: "Do not participate in the yearly raffle",
        type: ApplicationCommandOptionType.Subcommand,
      },
    ],

    async execute(interaction) {
      const command = interaction.options.getSubcommand()

      switch (command) {
        case "status":
          return await raffleStatus(bot, interaction)
        case "join":
          return await joinRaffle(bot, interaction)
        case "leave":
          return await leaveRaffle(bot, interaction)
      }
    },
  }
}

async function raffleStatus(
  bot: Bot,
  interaction: ChatInputCommandInteraction,
) {
  const {
    user: { id: userId },
  } = interaction
  await interaction.deferReply({ ephemeral: true })
  const isInRaffle = await isUserInRaffle(bot.db, userId)

  if (!isInRaffle) {
    await interaction.editReply({
      content: "You are not participating in the raffle",
    })
    return
  }
  const yearScore = await getYearScore(bot.db, userId, getPreviousYear())
  const entries = Math.floor(yearScore.points / POINTS_PER_ENTRY)

  const entriesMessage = `You will have ${entries} ${pluralize(
    "entry",
    entries,
    "entries",
  )} into the raffle.`

  await interaction.editReply({
    content: `You will be part of the raffle. ${entriesMessage}`,
  })
}

async function joinRaffle(bot: Bot, interaction: ChatInputCommandInteraction) {
  await interaction.deferReply({ ephemeral: true })

  const { user } = interaction
  const userId = user.id
  const yearScore = await getYearScore(bot.db, userId, getPreviousYear())
  const entries = Math.floor(yearScore.points / POINTS_PER_ENTRY)

  if (entries === 0) {
    await interaction.editReply({
      content: `You don't have enough points in ${getPreviousYear()} to claim an entry`,
    })
    return
  }

  try {
    await addUserToRaffle(bot.db, userId)
  } catch (error) {
    bot.logger.error(
      LOG_SCOPE,
      `Error while adding user ${user} to raffle`,
      error,
    )
    return await interaction.editReply({
      content: "There was an error adding you to the raffle.",
    })
  }

  bot.logger.info(LOG_SCOPE, `User ${user} added to the raffle.`)
  await interaction.editReply({
    content: `You've been added to the raffle. You will get ${entries} ${pluralize(
      "entry",
      entries,
      "entries",
    )}.`,
  })
}

async function leaveRaffle(bot: Bot, interaction: ChatInputCommandInteraction) {
  await interaction.deferReply({ ephemeral: true })

  const { user } = interaction
  const userId = user.id

  try {
    await removeUserFromRaffle(bot.db, userId)
  } catch (error) {
    bot.logger.error(
      LOG_SCOPE,
      `Error while removing user ${user} from raffle`,
      error,
    )
    return await interaction.editReply({
      content: "There was an error removing you from the raffle.",
    })
  }

  await interaction.editReply({
    content: "You've been removed from the raffle",
  })
}

export default command
