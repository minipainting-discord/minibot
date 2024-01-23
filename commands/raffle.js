import { ApplicationCommandOptionType } from "discord.js"
import {
  addUserToRaffle,
  isUserInRaffle,
  removeUserFromRaffle,
} from "../helpers/raffle.js"
import { getYearScore } from "../helpers/points.js"
import { getPreviousYear, pluralize } from "../utils.js"

const POINTS_PER_ENTRY = 20

export default function raffle(bot) {
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
          return await raffleStatus(interaction, bot)
        case "join":
          return await joinRaffle(interaction, bot)
        case "leave":
          return await leaveRaffle(interaction, bot)
      }
    },
  }
}

/**
 * raffleStatus
 */
async function raffleStatus(interaction, bot) {
  const { user } = interaction
  await interaction.deferReply({ ephemeral: true })
  const isInRaffle = await isUserInRaffle(bot, user)

  if (!isInRaffle) {
    await interaction.editReply({
      content: "You are not participating in the raffle",
    })
    return
  }
  const yearScore = await getYearScore(bot, user, getPreviousYear())
  const entries = Math.floor((yearScore?.points ?? 0) / POINTS_PER_ENTRY)

  const entriesMessage = `You will have ${entries} ${pluralize(
    "entry",
    entries,
    "entries",
  )} into the raffle.`

  await interaction.editReply({
    content: `You will be part of the raffle. ${entriesMessage}`,
  })
}

/**
 * joinRaffle
 */
async function joinRaffle(interaction, bot) {
  const { user } = interaction
  await interaction.deferReply({ ephemeral: true })
  const yearScore = await getYearScore(bot, user, getPreviousYear())
  const entries = Math.floor((yearScore?.points ?? 0) / POINTS_PER_ENTRY)
  const hasUserBeenAdded = await addUserToRaffle(bot, user)

  if (entries === 0) {
    await interaction.editReply({
      content: `You don't have enough points in ${getPreviousYear()} to claim an entry`,
    })
    return
  }

  if (hasUserBeenAdded) {
    await interaction.editReply({
      content: `You've been added to the raffle. You will get ${entries} ${pluralize(
        "entry",
        entries,
        "entries",
      )}.`,
    })
  } else {
    await interaction.editReply({
      content: "There was an error adding you to the raffle.",
    })
  }
}

/**
 * leaveRaffle
 */
async function leaveRaffle(interaction, bot) {
  const { user } = interaction
  await interaction.deferReply({ ephemeral: true })
  const hasUserBeenRemoved = await removeUserFromRaffle(bot, user)

  if (hasUserBeenRemoved) {
    await interaction.editReply({
      content: "You've been removed from the raffle",
    })
  } else {
    await interaction.editReply({
      content: "There was an error removing you from the raffle.",
    })
  }
}
