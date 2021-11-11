import { createClient } from "@supabase/supabase-js"

import logger from "./logger.js"

const { SUPABASE_KEY, SUPABASE_URL } = process.env

export function createSupabase() {
  const client = createClient(SUPABASE_URL, SUPABASE_KEY)

  logger.info("⚡️ Supabase connected ")

  return client
}
