import logger from "./logger.js"

export function checkEnvironment() {
  const required = ["DISCORD_API_TOKEN"]
  const missing = required.filter((variable) => !process.env[variable])

  if (missing.length) {
    const s = missing.length > 1 ? "s" : ""
    logger.fatal(`Missing environment variable${s}: ${missing.join(", ")}`)
  }
}
