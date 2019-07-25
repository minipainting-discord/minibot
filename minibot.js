const spawn = require("child_process").spawn
const exec = require("child_process").exec

function log(data) {
  console.log(String(data).trim())
}

function run() {
  const bot = spawn("node", ["index.js"])
  bot.on("close", restart)
  bot.stdout.on("data", log)
  bot.stderr.on("data", log)
}

function restart() {
  const gitPull = exec("git pull")
  gitPull.on("close", () => setTimeout(run, 2000))
}

run()
