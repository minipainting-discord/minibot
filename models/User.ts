import { SupabaseClient } from "@supabase/supabase-js"
import { Database } from "../database.types"

type User = {
  userId: string
  rankId: number | null
  displayName: string
  canParticipateInSecretSanta: boolean
}

type DBUser = Database["public"]["Tables"]["users"]["Row"]

function User(dbUser: DBUser): User {
  return {
    ...dbUser,
    canParticipateInSecretSanta: Boolean(dbUser.canParticipateInSecretSanta),
  }
}

async function updateUser(
  db: SupabaseClient<Database>,
  userId: string,
  update: Partial<User> & Pick<User, "displayName">,
): Promise<void> {
  const { error } = await db.from("users").upsert({
    userId: userId,
    ...update,
  })

  if (error) {
    throw error
  }
}

export { updateUser }
export type { User }
