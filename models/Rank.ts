import { Role } from "discord.js"
import { SupabaseClient } from "@supabase/supabase-js"
import { Database } from "../database-generated.types"

type DBRank = Database["public"]["Tables"]["ranks"]["Row"]

type Rank = {
  id: number
  roleId: string
  minPoints: number
  name: string
  color: string
}

type RankWithRole = Rank & {
  role: Role
}

function Rank(dbRank: DBRank): Rank {
  return {
    ...dbRank,
  }
}

function RankWithRole(rank: Rank, role: Role): RankWithRole {
  return { ...rank, role }
}

async function getSortedRanks(
  db: SupabaseClient<Database>,
): Promise<Array<Rank>> {
  const { data, error } = await db
    .from("ranks")
    .select()
    .order("minPoints", { ascending: true })

  if (error) {
    throw error
    // bot.logger.fatal("core", error.message, error)
  }

  return (data ?? []).map((rank) => Rank(rank))
}

export { RankWithRole, getSortedRanks }
export type { Rank }
