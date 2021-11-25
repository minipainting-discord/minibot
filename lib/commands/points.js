import { getCurrentScore, getLifetimeScore } from "../helpers/points.js"

import { Permission } from "./index.js"

export default {
  name: "points",
  description: "Show your or another user's points",
  permissions: [Permission.PUBLIC],
  options: [
    {
      name: "user",
      description: "An optional user to show points for",
      type: "USER",
    },
  ],

  async execute(interaction, bot) {
    const userArg = interaction.options.getUser("user")
    const user = userArg || interaction.user

    const currentScore = await getCurrentScore(bot, user)
    const lifetimeScore = await getLifetimeScore(bot, user)

    const score = {
      current: currentScore?.points || 0,
      lifetime: lifetimeScore?.points || 0,
    }

    interaction.reply(
      userArg
        ? `${user} has ${score.lifetime} lifetime points and ${score.current} current points`
        : `${user}, you have ${score.lifetime} lifetime points and ${score.current} current points`
    )
  },
}
