import { getManagedRoleFromOptions } from "../helpers/roles.js"

export default function roleAdmin(bot) {
  return {
    name: "role-admin",
    description: "Manage assignable roles",
    availability: bot.AVAILABILITY.MOD,
    options: [
      {
        name: "create",
        description: "🔓 Create a new assignable role",
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
        description: "🔓 Remove an assignable role",
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

    async execute(interaction) {
      const command = interaction.options.getSubcommand()

      switch (command) {
        case "create":
          return createRole(interaction, bot)
        case "remove":
          return removeRole(interaction, bot)
      }
    },
  }
}

/**
 * createRole
 */
async function createRole(interaction, bot) {
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
  const role = await getManagedRoleFromOptions(bot, interaction)

  if (!role) {
    return
  }

  await bot.db.from("managedRoles").delete().eq("roleId", role.id)
  await role.delete()

  interaction.reply(`Role \`${role.name}\` removed`)
}
