import { createSupabase } from "./lib/supabase.js"
import { start } from "repl"

const sb = createSupabase()

const repl = start("> ")
repl.context.sb = sb
repl.on("exit", () => process.exit())
