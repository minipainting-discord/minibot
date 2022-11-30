import { ApplicationCommandOptionType } from "discord.js"
import { shuffle } from "../utils.js"

const REGIONS = ["na", "eu", "any"]

const FLAGS = {
  na: "🇺🇸",
  eu: "🇪🇺",
  any: "🌏",
}

const NICE_THRESHOLD = 3500

export default function roleAdmin(bot) {
  return {
    name: "santa-admin",
    description: "Manage Secret Santa",
    availability: bot.AVAILABILITY.MOD,
    options: [
      {
        name: "list",
        description: "🔒 List Secret Santa participants",
        type: ApplicationCommandOptionType.Subcommand,
        options: [],
      },
      {
        name: "match",
        description: "🔒 Do the matching!",
        type: ApplicationCommandOptionType.Subcommand,
      },
    ],

    async execute(interaction) {
      const command = interaction.options.getSubcommand()

      switch (command) {
        case "list":
          return await listParticipants(interaction, bot)
        case "match":
          return await matchParticipants(interaction, bot)
        case "send":
          return await sendMatcheesToParticipants(interaction, bot)
      }
    },
  }
}

async function listParticipants(interaction, bot) {
  const { data: letters } = await bot.db.from("santaLetters").select()

  if (!letters?.length) {
    return interaction.reply({ content: ":shrug:", ephemeral: true })
  }

  return interaction.reply({
    content: [
      letters
        .map(
          (letter) =>
            `${FLAGS[letter.region]} ${letter.postCount} <@${letter.userId}>`
        )
        .join("\n"),
    ].join("\n"),
    ephemeral: true,
  })
}

async function matchParticipants(interaction, bot) {
  await interaction.deferReply({ ephemeral: true })
  const { data: letters } = await bot.db.from("santaLetters").select()
  const groups = {
    naughty: { na: [], eu: [], any: [] },
    nice: { na: [], eu: [], any: [] },
  }

  for (const letter of letters) {
    groups[getTier(letter)][letter.region].push(letter)
  }

  // If someone is alone in naughty/region, move it to nice
  for (const region of REGIONS) {
    if (groups.naughty[region].length === 1) {
      const letter = groups.naughty[region].pop()
      groups.nice[region].push(letter)
      bot.logger.info(
        "commands/santa-admin",
        `Upgraded user ${letter.userId} to the nice tier`
      )
    }
  }

  // Matching dance!
  for (const tier of ["naughty", "nice"]) {
    for (const region of REGIONS) {
      const group = groups[tier][region]
      const shuffledGroup = shuffle(group)

      for (const [i, letter] of shuffledGroup.entries()) {
        const matchee = shuffledGroup[(i + 1) % shuffledGroup.length]
        await bot.db
          .from("santaLetters")
          .update({ matcheeId: matchee.userId })
          .eq("userId", letter.userId)
      }
    }
  }

  return interaction.editReply({
    content: "Matching dance is done!",
    ephemeral: true,
  })
}

async function sendMatcheesToParticipants(interaction, bot) {
  return interaction.reply({ content: "WIP", ephemeral: true })
}

function getTier(letter) {
  return letter.postCount >= NICE_THRESHOLD ? "nice" : "naughty"
}
