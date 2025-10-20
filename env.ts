import { Logger } from "./logger"
import { pick, pluralize } from "./utils"

const REQUIRED_ENVIRONMENT_VARIABLES = [
  "BOT_MASTER_ID",
  "DISCORD_API_TOKEN",
  "SUPABASE_KEY",
  "SUPABASE_URL",
] as const

type HostEnv = Record<string, string | undefined>
type SafeEnv = Record<string, string>
type Env = {
  [K in (typeof REQUIRED_ENVIRONMENT_VARIABLES)[number]]: string
}

export function createEnv(environment: HostEnv, logger: Logger): Env {
  const missing = REQUIRED_ENVIRONMENT_VARIABLES.filter(
    (variable) => process.env[variable] === undefined,
  )

  if (missing.length > 0) {
    logger.fatal(
      "core/createEnv",
      `Missing environment ${pluralize("variable", missing.length)}: ${missing.join(", ")}`,
    )
  }

  return pick(environment as SafeEnv, REQUIRED_ENVIRONMENT_VARIABLES)
}

export type { Env }
