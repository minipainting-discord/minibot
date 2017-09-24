const Discord = require('discord.js'); // https://discord.js.org/#/ 
const client = new Discord.Client();
const settings = require('./settings.json');
const sql = require('sqlite');
const createCollage = require("photo-collage");
const sizeOf = require('image-size');
var url = require('url');
var http = require('https');

const miniGalleryChannelId = "236049686820159488";
const generalChannelId = "236042005929656320";
const botChannelId = "344320952991219712";
const pointsRequestChannelId = "344320952991219712";

var scoredb = 0;
var accountsdb = 0;

function set_points(message, user, new_points, current_level) {
  let member = message.guild.member(user);
  let role1 = message.guild.roles.find("name", "Dip 'N Forget");
  let role2 = message.guild.roles.find("name", "Ebay Propainted");
  let role3 = message.guild.roles.find("name", "C+C Plz");
  let role4 = message.guild.roles.find("name", "JALMM");
  let role5 = message.guild.roles.find("name", "Bub For The Bub Glub");

  function update_role(new_level, old_role, new_role) {
    if (current_level != new_level) {
      client.channels.get(generalChannelId)
        .sendMessage(user +
        ` :confetti_ball: Congratulations you reached **${new_role.name}** rank! :confetti_ball:`
        );

      if (old_role !== null) member.removeRole(old_role).catch(console.error);
      member.addRole(new_role).catch(console.error);

      let tmp = `UPDATE scores SET points = ${new_points}, level = ${new_level} WHERE userId = ${user.id}`
      console.log('tmp',tmp);
      scoredb.run(
        tmp
      );
    } else {
      let tmp2 = `UPDATE scores SET points = ${new_points} WHERE userId = ${user.id}`;
      console.log('tmp2',tmp2)
      scoredb.run(
        tmp2
        );
    }
  }

  if (new_points >= 70) {
    update_role(5, role4, role5);
  } else if (new_points >= 40) {
    update_role(4, role3, role4);
  } else if (new_points >= 20) {
    update_role(3, role2, role3);
  } else if (new_points >= 10) {
    update_role(2, role1, role2);
  } else if (new_points >= 5) {
    update_role(1, null, role1);
  }
}

// Open the local SQLite database to store account and score information.
Promise.all([
  sql.open('./score.sqlite', {
    Promise
  }),
  sql.open('./accounts.sqlite', {
    Promise
  })
]).then(function ([scoreDB, accountsDB]) {
  scoredb = scoreDB;
  accountsdb = accountsDB;
});

client.on('ready', () => {
  console.log('I\'m Online\nl\'m Online');
});

var commandPrefix = "!"
var waiting_users = [];

client.on('message', message => {
  if (message.author.bot)
    return;

  if (message.channel.type !== 'text')
    return;

  if (message.channel.id === miniGalleryChannelId) {
    let is_link = false;

    if (message.attachments.size == 0) {
      let message_text = message.content;
      if (message_text.startsWith('https://') ||
        message_text.startsWith('http://') ||
        message_text.startsWith('www')) {
        is_link = true;
      } else {
        message.delete();
        return;
      }
    }

    if (is_link) {
      client.channels.get(generalChannelId)
        .sendMessage(message.author + " : " + message.content);
      client.channels.get(pointsRequestChannelId)
        .sendMessage(message.author + " : " + message.content);
      return;
    }

    if (waiting_users.includes(message.author.id))
      return;

    waiting_users.push(message.author.id);
    message.channel
      .awaitMessages(m => m.attachments.size > 0 &&
        m.author.id == message.author.id, {
        time: 10e3
      })
      .then(collected => {
        let idx = waiting_users.indexOf(message.author.id);
        waiting_users.splice(idx, 1);

        let images = [];
        for (let attachment of message.attachments.values()) {
          images.push(attachment.url);
          if (images.length >= 3)
            break;
        }
        for (let msg of collected.values()) {
          for (let attachment of msg.attachments.values()) {
            images.push(attachment.url);
            if (images.length >= 3)
              break;
          }
          if (images.length >= 3)
            break;
        }

        // message.reply('www.collected' + images);
        let w = images.length;
        if (w > 3) {
          w = 3;
        }
        let h = images.length / w;

        var options = url.parse(images[0]);
        http.get(options, function (response) {
          var chunks = [];
          response.on('data', function (chunk) {
            chunks.push(chunk);
          }).on('end', function () {
            var buffer = Buffer.concat(chunks);
            const options = {
              sources: images,
              width: w, // number of images per row
              height: 1, // number of images per column
              imageWidth: sizeOf(buffer).width / w,
              imageHeight: sizeOf(buffer).height / w,
              backgroundColor: "#cccccc", // optional, defaults to black.
              spacing: 2, // optional: pixels between each image
            };
            createCollage(options).then((canvas) => {
              let buf = canvas.toBuffer();
              let genChan = client.channels.get(generalChannelId);
              let pointChan = client.channels.get(pointsRequestChannelId);
              if (genChan != null) {
                genChan.sendFile(buf, 'minigalleryimage.png',
                  message.author);
              }
              if (pointChan != null) {
                pointChan.sendFile(buf, 'minigalleryimage.png',
                  message.author);
              }
            });
          });
        });
      });

    return;
  }

  if (!message.content.startsWith(commandPrefix))
    return;

  const addPointsCmd = 1;
  const resetPointsCmd = 2;
  const pointsCmd = 3;
  const makersCmd = 4;
  const tutorialsCmd = 5;
  const leaderboardCmd = 6;
  const helpCmd = 7;
  const bioEndioCmd = 8;
  const redpianoCmd = 9;
  const sdubCmd = 10;
  const setRAccountCmd = 11;
  const redditCmd = 12;
  const setAlbumCmd = 13;
  const albumCmd = 14;
  const resetCmd = 15;

  let bot_command = 0;
  if (message.content.startsWith(commandPrefix + 'addpoints')) {
    bot_command = addPointsCmd;
  } else if (message.content.startsWith(commandPrefix + 'resetpoints')) {
    bot_command = resetPointsCmd;
  } else if (message.content.startsWith(commandPrefix + 'points')) {
    bot_command = pointsCmd;
  } else if (message.content.startsWith(commandPrefix + 'makers')) {
    bot_command = makersCmd;
  } else if (message.content.startsWith(commandPrefix + 'tutorials')) {
    bot_command = tutorialsCmd;
  } else if (message.content.startsWith(commandPrefix + 'leaderboard')) {
    bot_command = leaderboardCmd;
  } else if (message.content.startsWith(commandPrefix + 'help')) {
    bot_command = helpCmd;
  } else if (message.content.startsWith(commandPrefix + 'bio_endio')) {
    bot_command = bioEndioCmd;
  } else if (message.content.startsWith(commandPrefix + 'redpiano')) {
    bot_command = redpianoCmd;
  } else if (message.content.startsWith(commandPrefix + 'sdub')) {
    bot_command = sdubCmd;
  } else if (message.content.startsWith(commandPrefix + 'setredditaccount')) {
    bot_command = setRAccountCmd;
  } else if (message.content.startsWith(commandPrefix + 'reddit')) {
    bot_command = redditCmd;
  } else if (message.content.startsWith(commandPrefix + 'setalbum')) {
    bot_command = setAlbumCmd;
  } else if (message.content.startsWith(commandPrefix + 'album')) {
    bot_command = albumCmd;
  } else if (message.content.startsWith(commandPrefix + 'reset')) {
    bot_command = resetCmd;
  }

  let pointschannel = (message.channel.id === pointsRequestChannelId);
  let botchannel = (message.channel.id === botChannelId);
  let generalchannel = (message.channel.id === generalChannelId);

  let ignoreMessage = true;

  if (generalchannel && (bot_command == bioEndioCmd || bot_command == redpianoCmd)) {
    ignoreMessage = false;
  }

  if (botchannel) {
    ignoreMessage = false;
  }

  if (pointschannel
    && (bot_command == addPointsCmd || bot_command == resetPointsCmd || bot_command == pointsCmd)) {
    ignoreMessage = false;
  }

  if (ignoreMessage)
    return;

  if (bot_command == addPointsCmd) {
    console.log('addPoints:' + message.mentions.users);
    var user = message.mentions.users.first();
    var number = 0;
    var index = message.content.lastIndexOf(" ");
    if (index !== -1) {
      number = Number(message.content.substring(index + 1));
    }
    let adminRole = message.guild.roles.find("name", "Admin");
    let modRole = message.guild.roles.find("name", "Moderators");

    // Only allow Admin and Moderators to add points.
    if (!message.member.roles.has(adminRole.id) &&
      !message.member.roles.has(modRole.id) && 
       message.author.id != '134744140318638080') {
      message.reply(
        `:japanese_goblin:  Haha! Being sneaky are we? :japanese_goblin: `
      );
      return;
    }

    let new_points = number;
    let current_level = 0;
    let new_level = 0;

    scoredb.get(`SELECT * FROM scores WHERE userId ='${user.id}'`)
      .then(row => {
        if (!row) {
          scoredb.run(
            'INSERT INTO scores (userId, points, level) VALUES (?, ?, ?)', [
              user.id, 0, 0
            ]);
        } else {
          current_level = row.level;
          new_points += row.points;
          new_level = current_level;
        }
        console.log('addpoints: ' + user + ' ' + user.id + ' ' + new_points + ' ' + current_level);

        set_points(message, user, new_points, current_level);
        scoredb.get(`SELECT * FROM scores WHERE userId ='${user.id}'`).then(
          row => {
            message.reply(user + ` has ${row.points} points`);
          });
      })
      .catch(() => {
        console.error;
        scoredb
          .run(
          'CREATE TABLE IF NOT EXISTS scores (userId TEXT, points INTEGER, level INTEGER)'
          )
          .then(() => {
            scoredb.run(
              'INSERT INTO scores (userId, points, level) VALUES (?, ?, ?)', [
                user.id, 0, 0
              ]);

            set_points(message, user, new_points, current_level);
            scoredb.get(
              `SELECT * FROM scores WHERE userId ='${user.id}'`).then(
              row => {
                message.reply(user + ` has ${row.points} points`);
              });
          });
      });
    return;
  } else if (bot_command == resetPointsCmd) {
    var user = message.mentions.users.first();
    var number = 0;

    let myRole1 = message.guild.roles.find("name", "Admin");

    if (!message.member.roles.has(myRole1.id)) {
      message.reply(
        `:japanese_goblin:  Haha! Being sneaky are we? :japanese_goblin: `
      );
      return;
    }

    let member = message.guild.member(user);

    let myRole2 = message.guild.roles.find("name", "Dip 'N Forget");
    let myRole3 = message.guild.roles.find("name", "Ebay Propainted");
    let myRole4 = message.guild.roles.find("name", "C+C Plz");
    let myRole5 = message.guild.roles.find("name", "JALMM");
    let myRole6 = message.guild.roles.find("name", "Bub For The Bub Glub");

    if (member.roles.has(myRole2.id)) {
      member.removeRole(myRole2).catch(console.error);
    }

    if (member.roles.has(myRole3.id)) {
      member.removeRole(myRole3).catch(console.error);
    }

    if (member.roles.has(myRole4.id)) {
      member.removeRole(myRole4).catch(console.error);
    }

    if (member.roles.has(myRole5.id)) {
      member.removeRole(myRole5).catch(console.error);
    }

    if (member.roles.has(myRole6.id)) {
      member.removeRole(myRole6).catch(console.error);
    }

    scoredb.get(`SELECT * FROM scores WHERE userId ='${user.id}'`).then(row => {
      if (!row) {
        scoredb.run(
          'INSERT INTO scores (userId, points, level) VALUES (?, ?, ?)', [
            user.id, number, 0
          ]);
      } else {
        scoredb.run(
          `UPDATE scores SET points = ${number}, level = ${number} WHERE userId = ${user.id}`
        );
      }
      console.log("points-reset!");
      message.reply(user + ` reset to 0 points`);
      return;
    });
    return;
  } else if (bot_command == pointsCmd) {
    var user = message.author;
    if (message.mentions.users.size > 0) {
      user = message.mentions.users.first();
    }
    scoredb.get(`SELECT * FROM scores WHERE userId ='${user.id}'`).then(row => {
      if (!row) {
        message.reply(user + ` has 0 points`);
        return;
      }
      message.reply(user + ` has ${row.points} points`);
      return;
    });
    return;
  } else if (bot_command == makersCmd) {
    message.reply(
      `Here's a list of all manufacturers: https://www.reddit.com/r/minipainting/wiki/manufacturers`
    );
    return;
  } else if (bot_command == tutorialsCmd) {
    message.reply(
      `Here's a compilation of useful guides: https://www.reddit.com/r/minipainting/wiki/tutorials`
    );
    return;
  } else if (bot_command == leaderboardCmd) {
    scoredb.all(`SELECT * FROM scores ORDER BY points DESC LIMIT 10`).then(results => {
      if (results) {
        let userPromises = [];
        for (let i = 0; i < results.length; i++) {
          userPromises.push(client.fetchUser(results[i].userId));
        }
        Promise.all(userPromises).then(users => {
          let msg = '```';
          for( let i = 0; i < results.length; i++) {
            msg += `${results[i].points} - ${users[i].username} \n`;
          }
          msg += '```';
          message.reply(msg);
        });
      } else {
        message.reply("Oops, something went wrong!");
      }
    });
    return;
  } else if (bot_command == helpCmd) {
    message.reply(
      `**COMMAND LIST**\n
        "!points [user]":   Check a user's points!
        "!leaderboard":   Check the points leaderboard!
        "!makers":    You can find all mini related manufactores!
        "!tutorials":    You can find useful guide lists!
        "!setredditaccount [username]": You can link your reddit account!
        "!reddit [user]": Get a user's linked reddit account!
        "!setalbum [link]": You can link an album of your paintings!
        "!album [user]": Get a user's linked album!`
    );
    return;
  } else if (bot_command == bioEndioCmd) {
    message.reply(
      `
            C O N T R A S T
            O
            N
            T
            R
            A
            S
            T`
    );
    return;
  } else if (bot_command == redpianoCmd) {
    message.reply(`O I L`);
    return;
  } else if (bot_command == sdubCmd) {
    message.reply(`https://www.youtube.com/user/SDubist`);
    return;
  } else if (bot_command == setRAccountCmd) {
    let author = message.author;
    let index = message.content.lastIndexOf(" ");
    let redditAccount = "";
    if (index == -1) {
      message.reply('Usage: !setredditaccount [username]').then(msg => {
        msg.delete(7000);
      });
      message.delete();
      return;
    }
    redditAccount = message.content.substring(index + 1);
    if (redditAccount.startsWith('https://')) {
      redditAccount = redditAccount.replace('https://', '');
    }
    if (redditAccount.startsWith('http://')) {
      redditAccount = redditAccount.replace('http://', '');
    }
    if (redditAccount.startsWith('www.reddit.com')) {
      redditAccount = redditAccount.replace('www.reddit.com', '');
    }
    if (redditAccount.startsWith('/user/')) {
      redditAccount = redditAccount.replace('/user/', '');
    }

    accountsdb.get(`SELECT * FROM accounts WHERE userId ='${author.id}'`)
      .then(row => {
        if (!row) {
          accountsdb.run(
            'INSERT INTO accounts (userId, account, album) VALUES (?, ?, ?)', [
              author.id, redditAccount, ""
            ]);
        } else {
          accountsdb.run(
            `UPDATE accounts SET account = "${
            redditAccount
            }" WHERE userId = ${
            author.id
            }`
          );
        }
        console.log("set reddit account!");
      })
      .catch(() => {
        console.error;
        accountsdb
          .run(
          'CREATE TABLE IF NOT EXISTS accounts (userId TEXT, account TEXT, album TEXT)'
          )
          .then(() => {
            accountsdb.run(
              'INSERT INTO accounts (userId, account, album) VALUES (?, ?, ?)', [
                author.id, redditAccount, ""
              ]);
          });
      });

    message.reply(`Successfully linked to https://www.reddit.com/u/` +
      redditAccount);
    return;
  } else if (bot_command == redditCmd) {
    try {
      var user = message.author;
      if (message.mentions.users.size > 0) {
        user = message.mentions.users.first();
      }
      accountsdb.get(`SELECT * FROM accounts WHERE userId ='${user.id}'`)
        .then(row => {
          if (!row || row.account == "") {
            message.reply(user +
              ` does not have a linked Reddit account.`);
            return;
          } else {
            message.reply(`Reddit Account for ` + user +
              `: https://www.reddit.com/user/` + row.account);
            return;
          }
        });
    } catch (e) {
      message.reply('Invalid user');
      return;
    }
  } else if (bot_command == setAlbumCmd) {
    let author = message.author;
    let index = message.content.lastIndexOf(" ");
    let album = "";
    if (index == -1) {
      message.reply('Usage: !setalbum [link]');
      return;
    }
    album = message.content.substring(index + 1);
    if (!album.startsWith('http://') && !album.startsWith('https://')) {
      album = 'http://' + album;
    }

    accountsdb.get(`SELECT * FROM accounts WHERE userId ='${author.id}'`)
      .then(row => {
        if (!row) {
          accountsdb.run(
            'INSERT INTO accounts (userId, account, album) VALUES (?, ?, ?)', [
              author.id, "", album
            ]);
        } else {
          accountsdb.run(
            `UPDATE accounts SET album = "${
            album
            }" WHERE userId = ${author.id}`
          );
        }
        console.log("set album!");
      })
      .catch(() => {
        console.error;
        accountsdb
          .run(
          'CREATE TABLE IF NOT EXISTS accounts (userId TEXT, account TEXT, album TEXT)'
          )
          .then(() => {
            accountsdb.run(
              'INSERT INTO accounts (userId, account, album) VALUES (?, ?, ?)', [
                author.id, "", album
              ]);
          });
      });

    message.reply(`Successfully set album to ` + album);
  } else if (bot_command == albumCmd) {
    try {
      var user = message.author;
      if (message.mentions.users.size > 0) {
        user = message.mentions.users.first();
      }
      accountsdb.get(`SELECT * FROM accounts WHERE userId ='${user.id}'`)
        .then(row => {
          if (!row || row.album == "") {
            message.reply(user + ` does not have a linked album.`);
            return;
          } else {
            message.reply(`Album for ` + user + `: ` + row.album);
            return;
          }
        });
    } catch (e) {
      message.reply('Invalid user');
      return;
    }
  } else if (message.content.startsWith(commandPrefix + "reset")) {
    let myRole1 = message.guild.roles.find("name", "Admin");

    if (!message.member.roles.has(myRole1.id) &&
      message.author.id != '134744140318638080') {
      return;
    }
    message.reply(`Coming back!`);

    setTimeout(() => {
      process.exit();
    }, 1000);
  }
});

client.login(settings.token);
