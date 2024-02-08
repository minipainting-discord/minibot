import { SupabaseClient } from "@supabase/supabase-js"
import { Database } from "../database.types"
import { Role } from "discord.js"

type DBManagedRole = Database["public"]["Tables"]["managedRoles"]["Row"]

type ManagedRole = {
  id: number
  description: string
  name: string
  roleId: string
  createdBy: string
}

function ManagedRole(dbManagedRole: DBManagedRole): ManagedRole {
  return {
    ...dbManagedRole,
  }
}

async function getManagedRoleFromDiscordRole(
  db: SupabaseClient<Database>,
  discordRoleId: string,
) {
  const { data } = await db
    .from("managedRoles")
    .select()
    .eq("roleId", discordRoleId)
    .single()

  return data ? ManagedRole(data) : null
}

async function createManagedRole(
  db: SupabaseClient<Database>,
  managedRole: Omit<ManagedRole, "id">,
) {
  // { roleId: newRole.id, name, description, createdBy })
  const { error } = await db.from("managedRoles").insert(managedRole)

  if (error) {
    throw error
  }
}

async function removeManagedRole(
  db: SupabaseClient<Database>,
  managedRole: ManagedRole,
) {
  const { error } = await db
    .from("managedRoles")
    .delete()
    .eq("roleId", managedRole.id)

  if (error) {
    throw error
  }
}

async function updateManagedRole(
  db: SupabaseClient<Database>,
  managedRole: ManagedRole,
  description: string,
) {
  const { error } = await db
    .from("managedRoles")
    .update({ description })
    .eq("roleId", managedRole.id)

  if (error) {
    throw error
  }
}

export {
  ManagedRole,
  getManagedRoleFromDiscordRole,
  createManagedRole,
  removeManagedRole,
  updateManagedRole,
}

// async function createManagedRole()
