export async function getManagedRoleFromOptions(bot, interaction) {
  const role = interaction.options.getRole("role")

  const { data: managedRole } = await bot.db
    .from("managedRoles")
    .select()
    .eq("roleId", role.id)
    .single()

  if (!managedRole) {
    interaction.reply({
      content: `Role ${role} is not managed by the bot.`,
      ephemeral: true,
    })
  }

  return role
}
