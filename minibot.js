const spawn = require("child_process").spawn
const exec = require("child_process").exec
let node_bot = 0

function bot_logging(data) {
  console.log("bot_data: " + data)
}

function bot_restart() {
  let gitpull = exec("git pull")
  gitpull.on("close", () => {
    setTimeout(() => {
      node_bot = spawn("node", ["index.js"])
      node_bot.on("close", bot_restart)
      node_bot.stdout.on("data", bot_logging)
      node_bot.stderr.on("data", bot_logging)
    }, 2000)
  })
}

node_bot = spawn("node", ["index.js"])
node_bot.on("close", bot_restart)
node_bot.stdout.on("data", bot_logging)
node_bot.stderr.on("data", bot_logging)
