import { Permission } from "./index.js"

export default {
  name: "role",
  description: "Manage your assignable roles",
  permissions: [Permission.PUBLIC],
  options: [
    {
      name: "list",
      description: "List your current roles and assignable ones",
      type: "SUB_COMMAND",
      options: [
        {
          name: "joined",
          description: "Whether to show only joined roles or all roles",
          type: "BOOLEAN",
        },
      ],
    },
    {
      name: "join",
      description: "List your current roles and assignable ones",
      type: "SUB_COMMAND",
    },
    {
      name: "leave",
      description: "List your current roles and assignable ones",
      type: "SUB_COMMAND",
    },
    {
      name: "create",
      description: "Create a new assignable role [MOD ONLY]",
      type: "SUB_COMMAND",
      options: [
        {
          name: "name",
          description: "Name of the role to add",
          type: "STRING",
          required: true,
        },
        {
          name: "description",
          description: "Description of the role to add",
          type: "STRING",
          required: true,
        },
      ],
    },
    {
      name: "remove",
      description: "Remove an assignable role [MOD ONLY]",
      type: "SUB_COMMAND",
      options: [
        {
          name: "role",
          description: "The role to remove",
          type: "ROLE",
          required: true,
        },
      ],
    },
  ],

  async execute(interaction, bot) {
    const command = interaction.options.getSubcommand()

    switch (command) {
      case "list":
        return listRoles(interaction, bot)
      case "join":
        return joinRole(interaction, bot)
      case "leave":
        return leaveRole(interaction, bot)
      case "create":
        return createRole(interaction, bot)
      case "remove":
        return removeRole(interaction, bot)
    }
  },
}

/**
 * listRoles
 */
async function listRoles(interaction, bot) {
  const { data: managedRoles } = await bot.db.from("managedRoles").select()

  interaction.reply(
    "managed roles: " + managedRoles.map((r) => r.name).join(",")
  )
}

/**
 * joinRole
 */
async function joinRole(interaction, bot) {}

/**
 * leaveRole
 */
async function leaveRole(interaction, bot) {}

/**
 * createRole
 */
async function createRole(interaction, bot) {
  if (!bot.isModerator(interaction.member)) {
    throw new bot.PermissionError()
  }

  const name = interaction.options.getString("name")
  const description = interaction.options.getString("description")
  const createdBy = interaction.member.id

  if (bot.guild.roles.cache.some((role) => role.name === name)) {
    return interaction.reply({
      content: `Role \`${name}\` already exists.`,
      ephemeral: true,
    })
  }

  const newRole = await bot.guild.roles.create({
    name,
    mentionable: true,
    reason: `Role created by ${createdBy}: ${description}`,
  })

  await bot.db
    .from("managedRoles")
    .insert({ roleId: newRole.id, name, description, createdBy })

  interaction.reply(`Created role ${newRole}.`)
}

/**
 * removeRole
 */
async function removeRole(interaction, bot) {
  if (!bot.isModerator(interaction.member)) {
    throw new bot.PermissionError()
  }

  const role = interaction.options.getRole("role")

  const { data: managedRole } = await bot.db
    .from("managedRoles")
    .select()
    .eq("roleId", role.id)
    .single()

  if (!managedRole) {
    return interaction.reply({
      content: `Role ${role} is not managed by the bot.`,
      ephemeral: true,
    })
  }

  await bot.db.from("managedRoles").delete().eq("roleId", role.id)
  await role.delete()

  interaction.reply(`Role \`${role.name}\` removed`)
}
