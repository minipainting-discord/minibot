import { Role } from "discord.js"
import { Database, DatabaseClient } from "../database.types"

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

async function getSortedRanks(db: DatabaseClient): Promise<Array<Rank>> {
  const { data, error } = await db
    .from("ranks")
    .select()
    .order("minPoints", { ascending: true })

  if (error) {
    throw error
  }

  return (data ?? []).map((rank: DBRank) => Rank(rank))
}

export { RankWithRole, getSortedRanks }
export type { Rank }
