import { checkEnvironment } from "./lib/env.js"
import { createBot } from "./lib/bot.js"

checkEnvironment()

createBot().start()
