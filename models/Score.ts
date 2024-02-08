import { SupabaseClient } from "@supabase/supabase-js"
import { Database } from "../database.types"

type DBYearScore = Database["public"]["Tables"]["leaderboard"]["Row"]

type YearScore = {
  userId: string
  points: number
  year: number
}

function YearScore(dbScore: DBYearScore): YearScore {
  return {
    ...dbScore,
  }
}

type DBLifetimeScore = Database["public"]["Views"]["lifetime"]["Row"]

type LifetimeScore = Omit<YearScore, "year">

function LifetimeScore(dbLifetimeScore: DBLifetimeScore): LifetimeScore {
  return {
    ...dbLifetimeScore,
    points: dbLifetimeScore.points ?? 0,
  }
}

type Score = YearScore | LifetimeScore

async function getYearScore(
  db: SupabaseClient<Database>,
  userId: string,
  year: number,
): Promise<YearScore> {
  const { data: yearScore } = await db
    .from("leaderboard")
    .select()
    .limit(1)
    .match({ userId, year })
    .single()

  return YearScore(yearScore ?? { userId, year, points: 0 })
}

async function getLifetimeScore(
  db: SupabaseClient<Database>,
  userId: string,
): Promise<LifetimeScore> {
  const { data: lifetimeScore } = await db
    .from("lifetime")
    .select()
    .limit(1)
    .match({ userId })
    .single()

  return LifetimeScore(lifetimeScore ?? { userId, points: 0 })
}

async function getYearLeaderboard(
  db: SupabaseClient<Database>,
  year: number,
): Promise<Array<YearScore>> {
  const { data } = await db
    .from("leaderboard")
    .select()
    .limit(10)
    .order("points", { ascending: false })
    .eq("year", year)

  return (data ?? []).map((score) => YearScore(score))
}

async function getLifetimeLeaderboard(
  db: SupabaseClient<Database>,
): Promise<Array<LifetimeScore>> {
  const { data } = await db
    .from("lifetime")
    .select()
    .limit(10)
    .order("points", { ascending: false })

  return (data ?? []).map((lifetimeScore) => LifetimeScore(lifetimeScore))
}

async function updateScore(
  db: SupabaseClient<Database>,
  userId: string,
  points: number,
  year: number,
) {
  const { error } = await db
    .from("leaderboard")
    .upsert({ userId, year, points })

  if (error) {
    throw error
  }
}

export {
  getYearScore,
  getLifetimeScore,
  getYearLeaderboard,
  getLifetimeLeaderboard,
  updateScore,
}
export type { Score, YearScore, LifetimeScore }
