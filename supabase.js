import { createClient } from "@supabase/supabase-js"

export default function createSupabase({ url, key, logger }) {
  const client = createClient(url, key)

  logger.info("⚡️ Supabase connected ")

  return client
}
