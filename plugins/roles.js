const ROLE_USAGE =
  "`!role add ROLE_NAME [DESCRIPTION] | !role remove ROLE_NAME | !role list`"

module.exports = {
  name: "roles",

  setup: async (bot) => {
    await bot.db.run(
      `CREATE TABLE IF NOT EXISTS managedRoles (
        roleId TEXT PRIMARY KEY,
        name TEXT,
        description TEXT,
        createdBy TEXT
      )`,
    )
  },

  commands: [
    {
      keyword: "role",
      help: [
        "`!role add ROLE_NAME`: Add a temporary role",
        "`!role remove ROLE_NAME`: Remove a temporary role",
        "`!role list`: List temporary roles",
      ],
      helpMod: true,
      execute: role,
    },
    {
      keyword: "join",
      help: "`!join [ROLE_NAME]`: Show available roles or give yourself a role",
      execute: join,
    },
    {
      keyword: "leave",
      help: "`!leave [ROLE_NAME]`: Leave an assignable role",
      execute: leave,
    },
    {
      keyword: "roles",
      help: "`!roles`: List your currently assigned roles",
      execute: roles,
    },
  ],
}

async function role(bot, message, ...args) {
  if (!bot.fromModerator(message)) {
    return
  }

  const command = args.shift()

  switch (command) {
    case "add":
      addRole(bot, message, ...args)
      break
    case "remove":
      removeRole(bot, message, ...args)
      break
    case "list":
      listRoles(bot, message)
      break
    default:
      message.reply(ROLE_USAGE)
  }
}

async function join(bot, message, roleName) {
  if (!roleName) {
    return listRoles(bot, message, false)
  }

  const managedRole = await bot.db.get(
    "SELECT * from managedRoles WHERE name = ?",
    roleName,
  )

  if (!managedRole) {
    return message.reply(`Role ${roleName} is not joinable.`)
  }

  if (message.member.roles.cache.has(managedRole.roleId)) {
    return message.reply(`you already have this role!`)
  }

  const role = await bot.guild.roles.cache.get(managedRole.roleId)

  await message.member.roles.add(role)
  message.reply(`role added!`)
}

async function leave(bot, message, roleName) {
  if (!roleName) {
    return listUserRoles(message.member, bot, message)
  }

  const managedRole = await bot.db.get(
    "SELECT * from managedRoles WHERE name = ?",
    roleName,
  )

  if (!managedRole) {
    return message.reply(`Role ${roleName} does not exist.`)
  }

  const role = await bot.guild.roles.cache.get(managedRole.roleId)

  if (!message.member.roles.cache.has(managedRole.roleId)) {
    return message.reply(`you don't have the \`${roleName}\` role`)
  }

  await message.member.roles.remove(role)
  message.reply(`role removed!`)
}

async function roles(bot, message) {
  return listUserRoles(message.member, bot, message)
}

async function addRole(bot, message, roleName, description = "") {
  if (!roleName) {
    return message.reply(ROLE_USAGE)
  }

  if (bot.guild.roles.cache.some((role) => role.name === roleName)) {
    return message.reply(`Role ${roleName} already exists.`)
  }

  const newRole = await bot.guild.roles.create({
    data: {
      name: roleName,
      mentionable: true,
    },
    reason: `Role created by @${message.author.username}: ${description}`,
  })

  await bot.db.run(
    "INSERT INTO managedRoles (roleId, name, description, createdBy) VALUES (?, ?, ?, ?)",
    [newRole.id, newRole.name, description, message.author.id],
  )

  message.reply(`Created role <@&${newRole.id}>`)
}

async function removeRole(bot, message, roleName) {
  if (!roleName) {
    return message.reply(ROLE_USAGE)
  }

  const managedRole = await bot.db.get(
    "SELECT * from managedRoles WHERE name = ?",
    roleName,
  )

  if (!managedRole) {
    return message.reply(`Role ${roleName} is not managed by the bot.`)
  }

  const role = await bot.guild.roles.cache.get(managedRole.roleId)

  if (!role) {
    return message.reply(`Role ${roleName} does not exist.`)
  }

  await bot.db.run("DELETE FROM managedRoles where roleId = ?", role.id)
  await role.delete()

  message.reply(`Deleted role ${roleName}`)
}

async function listRoles(bot, message, showDetails = true) {
  const managedRoles = await bot.db.all("SELECT * FROM managedRoles")

  if (managedRoles.length > 0) {
    message.reply(
      [
        "here are the available roles:",
        ...managedRoles.map((role) =>
          showDetails
            ? `- ${formatRole(role, showDetails)}`
            : `- ${formatRole(role, showDetails)}`,
        ),
      ].join("\n"),
    )
  } else {
    message.reply(
      showDetails
        ? "No temporary roles. Add one with `!role add ROLE_NAME [DESCRIPTION]`"
        : "There currently are no roles to join.",
    )
  }
}

async function listUserRoles(member, bot, message) {
  const managedRoles = await bot.db.all("SELECT * FROM managedRoles")

  const memberManagedRoles = managedRoles.filter((managedRole) =>
    member.roles.cache.has(managedRole.roleId),
  )

  if (memberManagedRoles.length > 0) {
    message.reply(
      [
        "here are your assigned roles:",
        ...memberManagedRoles.map((role) => `- ${formatRole(role)}`),
      ].join("\n"),
    )
  } else {
    message.reply(
      "You don't have any assignable roles. Join some with `!join`!",
    )
  }
}

function formatRole(role, showDetails = false) {
  return [
    `\`${role.name}\``,
    role.description.length && `(${role.description})`,
    showDetails && `- added by <@${role.createdBy}>`,
  ]
    .filter(Boolean)
    .join(" ")
}
