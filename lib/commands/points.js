import { Permission } from "./index.js"

export default {
  name: "points",
  description: "The Original Minipainting Point System™️",
  permissions: [Permission.PUBLIC],
  options: [
    {
      name: "show",
      description: "Show your or another user's points",
      type: "SUB_COMMAND",
      options: [
        {
          name: "user",
          description: "An optional user to show points for",
          type: "USER",
        },
      ],
    },
    {
      name: "leaderboard",
      description: "Display the current leaderboard status",
      type: "SUB_COMMAND",
    },
    {
      name: "add",
      description: "Add points to an user [MOD ONLY]",
      type: "SUB_COMMAND",
      options: [
        {
          name: "user",
          description: "The user to add points to",
          type: "USER",
          required: true,
        },
        {
          name: "points",
          description: "The amount of points to add",
          type: "INTEGER",
          required: true,
        },
      ],
    },
  ],

  async execute(interaction, bot) {
    const command = interaction.options.getSubcommand()

    switch (command) {
      case "show":
        return showPoints(interaction, bot)
      case "leaderboard":
        return showLeaderboard(interaction, bot)
      case "add":
        return addPoints(interaction, bot)
    }
  },
}

/**
 * showPoints
 */
async function showPoints(interaction, bot) {}

/**
 * showLeaderboard
 */
async function showLeaderboard(interaction, bot) {}

/**
 * addPoints
 */
async function addPoints(interaction, bot) {
  if (!bot.isModerator(interaction.member)) {
    throw new bot.PermissionError()
  }

  const user = interaction.options.getUser("user")
  const points = interaction.options.getInteger("points")

  const userId = user.id
  const year = new Date().getFullYear()

  const { data: currentScore } = await bot.db
    .from("leaderboard")
    .select()
    .single()
    .match({ userId, year })

  const { data: lifetimeScore } = await bot.db
    .from("lifetime")
    .select()
    .single()
    .match({ userId })

  const newPoints = {
    current: (currentScore?.points || 0) + points,
    lifetime: (lifetimeScore?.points || 0) + points,
  }

  if (currentScore) {
    await bot.db
      .from("leaderboard")
      .update({ points: newPoints.current })
      .match({ userId, year })
  } else {
    await bot.db
      .from("leaderboard")
      .insert({ userId, year, points: newPoints.current })
  }

  interaction.reply(
    `${user} now has ${newPoints.current} current points and ${newPoints.lifetime} lifetime points`
  )
}
