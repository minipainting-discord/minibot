const SQL = require("sql-template-strings")

const { pluralize } = require("../utils")

const TRACK_USAGE = "`!track shame|painted CATEGORY COUNT`"
const EXAMPLE_CATEGORIES = [
  "small",
  "large",
  "bust",
  "diorama",
  "terrain",
  "modelkit",
]

module.exports = {
  name: "track",

  setup: async bot => {
    await bot.db.run(
      `CREATE TABLE IF NOT EXISTS shame (
        userId   TEXT,
        category TEXT,
        amount   INTEGER DEFAULT 0,
        PRIMARY KEY (userId, category)
      )`,
    )
    await bot.db.run(
      `CREATE TABLE IF NOT EXISTS painted (
        userId   TEXT,
        category TEXT,
        amount   INTEGER DEFAULT 0,
        PRIMARY KEY (userId, category)
      )`,
    )
  },

  commands: [
    {
      keyword: "track",
      help: [
        `${TRACK_USAGE}: Track painted models and models in your pile of shame`,
      ],
      execute: track,
    },
  ],
}

async function track(bot, message, db, category, count) {
  if (!db && !category && !count) {
    return trackShow(bot, message)
  }

  if (db === "help") {
    return trackHelp(bot, message)
  }

  if (db !== "shame" && db !== "painted") {
    return message.reply(TRACK_USAGE)
  }

  if (!category && !count) {
    return trackShow(bot, message, db)
  }

  const numCount = parseInt(count, 10)
  if (isNaN(numCount)) {
    return message.reply(TRACK_USAGE)
  }

  if (!category.match(/^[a-zA-Z0-9_-]+$/)) {
    return message.reply(TRACK_USAGE)
  }

  try {
    const userId = message.author.id
    await bot.db.run(
      SQL`INSERT INTO `.append(db).append(SQL` (userId, category, amount)
       VALUES (${userId}, ${category}, ${numCount})
       ON CONFLICT(userId, category) DO
       UPDATE SET amount = amount + ${numCount}`),
    )
    const reply = await message.reply(
      `Added ${count} ${category} ${pluralize("model", numCount)} to ${
        db === "shame" ? "your shame pile" : "your painted models"
      }.`,
    )
    setTimeout(async () => {
      await message.delete()
      await reply.delete()
    }, 10 * 1000)
  } catch (err) {
    console.error(err)
  }
}

async function trackShow(bot, message, db = null) {
  const userId = message.author.id
  const painted = await bot.db.all(
    SQL`SELECT * FROM painted WHERE userId = ${userId}`,
  )
  const shame = await bot.db.all(
    SQL`SELECT * FROM shame WHERE userId = ${userId}`,
  )
  console.log(painted, shame)

  const showPainted = db === null || db === "painted"
  const showShame = db === null || db === "shame"
  const totalPainted = painted.reduce((a, e) => a + e.amount, 0)
  const totalShame = shame.reduce((a, e) => a + e.amount, 0)

  message.reply(
    [
      "",
      showPainted &&
        `Painted models: **${totalPainted}** (${painted
          .map(c => `\`${c.category}\`: ${c.amount}`)
          .join(", ")})`,
      showShame &&
        `Pile of shame: **${totalShame}** (${shame
          .map(c => `\`${c.category}\`: ${c.amount}`)
          .join(", ")})`,
    ]
      .filter(s => s !== false)
      .join("\n"),
  )
}

function trackHelp(bot, message) {
  return message.reply(
    [
      TRACK_USAGE,
      `Examples for \`CATEGORY\`: ${EXAMPLE_CATEGORIES.join(", ")}`,
      "Without any argument, it shows both your painted models and pile of shame.",
    ].join("\n"),
  )
}
