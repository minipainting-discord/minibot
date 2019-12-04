const SQL = require("sql-template-strings")

const { pluralize } = require("../utils")

const TRACK_USAGE = "`!track shame|painted CATEGORY COUNT`"
const CATEGORIES = ["small", "large", "bust", "diorama", "modelkit"]
const CATEGORY_DESCRIPTIONS = {
  small: "Up to and including 54mm scale minis",
  large: "Larger than 54mm scale minis",
  bust: "Busts",
  diorama: "Dioramas",
  modelkit: "Model Kits",
}
const BLANK_TRACKER = CATEGORIES.reduce((a, e) => ({ ...a, [e]: 0 }), {})

module.exports = {
  name: "track",

  setup: async bot => {
    await bot.db.run(
      `CREATE TABLE IF NOT EXISTS shame (
        userId   TEXT,
        small    INTEGER DEFAULT 0,
        large    INTEGER DEFAULT 0,
        bust     INTEGER DEFAULT 0,
        diorama  INTEGER DEFAULT 0,
        modelkit INTEGER DEFAULT 0,
        PRIMARY KEY (userId)
      )`,
    )
    await bot.db.run(
      `CREATE TABLE IF NOT EXISTS painted (
        userId   TEXT,
        small    INTEGER DEFAULT 0,
        large    INTEGER DEFAULT 0,
        bust     INTEGER DEFAULT 0,
        diorama  INTEGER DEFAULT 0,
        modelkit INTEGER DEFAULT 0,
        PRIMARY KEY (userId)
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

  if (!CATEGORIES.includes(category)) {
    return message.reply(
      `Unknown category \`${category}\`. Use \`!track help\` to see available categories.`,
    )
  }

  try {
    const userId = message.author.id
    await bot.db.run(
      `INSERT INTO ${db} (userId, ${category})
       VALUES (${userId}, ${numCount})
       ON CONFLICT(userId) DO
       UPDATE SET ${category} = ${category} + ${numCount}`,
    )
    message.reply(
      `Added ${count} ${category} ${pluralize(
        "model",
        numCount,
      )} to your shame pile.`,
    )
  } catch (err) {
    console.error(err)
  }
}

async function trackShow(bot, message, db = null) {
  const userId = message.author.id
  const painted =
    (await bot.db.get(SQL`SELECT * FROM painted WHERE userId = ${userId}`)) ||
    BLANK_TRACKER
  const shame =
    (await bot.db.get(SQL`SELECT * FROM shame WHERE userId = ${userId}`)) ||
    BLANK_TRACKER

  const showPainted = db === null || db === "painted"
  const showShame = db === null || db === "shame"
  const { totalPainted, totalShame } = CATEGORIES.reduce(
    (a, e) => ({
      totalPainted: a.totalPainted + painted[e],
      totalShame: a.totalShame + shame[e],
    }),
    { totalPainted: 0, totalShame: 0 },
  )

  message.reply(
    [
      "",
      showPainted &&
        `Painted models: **${totalPainted}** (${CATEGORIES.map(
          c => `\`${c}\`: ${painted[c]}`,
        ).join(", ")})`,
      showShame &&
        `Pile of shame: **${totalShame}** (${CATEGORIES.map(
          c => `\`${c}\`: ${shame[c]}`,
        ).join(", ")})`,
    ]
      .filter(s => s !== false)
      .join("\n"),
  )
}

function trackHelp(bot, message) {
  return message.reply(
    [
      TRACK_USAGE,
      "Where `CATEGORY` is one of:",
      ...CATEGORIES.map(
        category => `  - \`${category}\`: ${CATEGORY_DESCRIPTIONS[category]}`,
      ),
      "Without any argument, it shows both your painted models and pile of shame.",
    ].join("\n"),
  )
}
