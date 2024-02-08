import { createClient } from "@supabase/supabase-js"
import { Logger } from "./logger"
import { Database } from "./database.types"

interface CreateSupabaseArgs {
  url: string
  key: string
  logger: Logger
}

export function createSupabase({ url, key, logger }: CreateSupabaseArgs) {
  const client = createClient<Database>(url, key)

  logger.info("supabase", "⚡️ Supabase connected ")

  return client
}
