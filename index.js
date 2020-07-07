const fetch = require('node-fetch');
const Discord = require("discord.js");
const bot = new Discord.Client();
const WebSocket = require("ws")
const {
    encode,
    decode
} = require("msgpack-lite")

var token = process.env.TOKEN;

try {
    token = require("./token");
} catch {
    token = process.env.TOKEN;
}

var PREFIX = "v!";

bot.on("ready", () => {
    console.log("The bot is online!");
})

bot.on("message", message => {
    if (message.content.slice(PREFIX.length) == message.content.replace(PREFIX, "")) {
        let args = message.content.replace(PREFIX, "").split(" ")
        let member = message.guild.members.cache.get(message.author.id);

        switch (args[0].toLowerCase()) {
            case "help":
            case "h":
                var embed = new Discord.MessageEmbed()
                    .setTitle("Help")
                    .setColor("#a834eb")
                    .addField("Prefix", "v!")
                    .addField("Commands", [
                        '> *help* - this command',
                        '> *game <game id>* - gets game info',
                        '> *leaderboard <daily or dailyscore>* - finds a match',
                        '> *findgame* - gets leaderboard info',
                        "> *leaderboard <daily or dailyscore> <player name>* - gets players daily stats"
                    ])
                    .addField("Invite Link", "[Click Here!](https://discord.com/api/oauth2/authorize?client_id=728780263135510538&permissions=2147483639&scope=bot)")
                message.channel.send(embed)
                break;
            case "game":
            case "g":
            case "gameinfo":
                //https://venge.io/#A7B13
                try {

                    var pin = ((args[1]).replace("http://", "https://").replace("https://venge.io/#", "").replace("#", "")).toUpperCase(),
                        pin2 = args[1];
                    var embed = new Discord.MessageEmbed()
                        .setColor("#a834eb")
                        .setTitle("Fetching the Game Info for Game #" + "pin")
                        .setDescription("It may take a bit")
                    message.channel.send(embed).then(msg => {
                        fetch("https://gateway.venge.io/?request=get_room&hash=" + pin)
                            .then(response => response.json())
                            .then(data => {
                                console.log(data)
                                var embed = new Discord.MessageEmbed()
                                    .setColor("#a834eb")
                                if (data.success === true) {
                                    var data2 = data.result;
                                    embed.addField("Map", data2.map)
                                        .addField("Country", data2.country)
                                        .addField("Private", ((!parseInt(data2.is_private)) === false))
                                        .addField("Player Count", data2.connected_players)
                                        .addField("Max Player Count", data2.max_player)
                                        .setTitle(`Game ${pin} Info`)
                                        .setDescription("")
                                        .setURL("https://venge.io/#" + pin);
                                } else {
                                    embed.setTitle("Game not found")
                                        .setDescription("Game " + pin2 + " not found")
                                        .setFooter("an ERROR has occurred");
                                }
                                msg.edit(embed)
                            });
                    }).catch(console.error);
                } catch (err) {
                    message.channel.send((new Discord.MessageEmbed())
                        .setColor("#a834eb")
                        .setTitle("An error had occurred")
                        .setDescription("")
                        .setFooter("ERROR"))
                }
                break;
            case "findgame":
            case "fg":
            case "findroom":
            case "fr":
                var embed = new Discord.MessageEmbed()
                    .setColor("#a834eb")
                    .setTitle("Finding a Game for you")
                    .setDescription("It may take a bit")
                message.channel.send(embed).then(msg => {
                        fetch("https://gateway.venge.io/?request=find_room")
                            .then(response => response.json())
                            .then(data => {
                                console.log(data)
                                if (data.success === true) {
                                    var pin = data.result;
                                    embed.setTitle(`Game ${pin}`)
                                        .setURL("https://venge.io/" + pin)
                                        .setDescription("")
                                } else {
                                    embed.setTitle("An error had occurred")
                                        .setDescription("")
                                        .setFooter("ERROR");
                                }
                                msg.edit(embed)
                            });
                    })
                    .catch(console.error);
                break;
            case "l":
            case "leaders":
            case "leaderboard":
                if (args[1] === undefined) {
                    args[1] = "";
                };
                var embed = new Discord.MessageEmbed()
                    .setColor("#a834eb")
                    .setTitle("Finding the leaderboard: " + args[1])
                    .setDescription("It may take a bit");
                message.channel.send(embed).then(msg => {
                    embed.setDescription("")
                    switch (args[1]) {
                        case "daily":
                        case "":
                        case "d":
                            fetch("https://gateway.venge.io/?request=leaderboard&sort=rank")
                                .then(response => response.json())
                                .then(data => {
                                    var finalResult = [];
                                    var playerStats = {};
                                    for (x in data.result) {
                                        console.log(data.result[x])
                                        //console.log([x, (parseInt(x) + 1).toString()])
                                        if (args[2] === undefined) {
                                            finalResult.push((parseInt(x) + 1).toString() + ". " + data.result[x].username)
                                        } else {
                                            if (data.result[x].username.toLowerCase() === args[2].toLowerCase()) {
                                                playerStats = data.result[x];
                                            }
                                        }
                                    }
                                    if (args[2] === undefined) {
                                        embed.setTitle("Daily Leaderboard")
                                            .addField("Resets in", data.date)
                                            .addField("Leaderboard", finalResult)
                                    } else {
                                        if (playerStats.kdr !== undefined) {
                                            embed.setTitle(args[2] + "'s Daily Player Stats")
                                                .addField("KDR", playerStats.kdr)
                                                .addField("Kills", playerStats.kills)
                                                .addField("Deaths", playerStats.kills)
                                                .addField("Experience", playerStats.experience)
                                        } else {
                                            embed.setTitle("Player on the leaderboard not found")
                                                .setDescription(args[2] + " is not on the Daily leaderboard")
                                                .setFooter("an ERROR has occurred");
                                        }
                                    }
                                    msg.edit(embed)
                                })
                            break;
                        case "score":
                        case "dailyscore":
                        case "daily_score":
                        case "s":
                            fetch("https://gateway.venge.io/?request=leaderboard&sort=score")
                                .then(response => response.json())
                                .then(data => {
                                    var finalResult = [];
                                    var playerStats = {};
                                    for (x in data.result) {
                                        console.log(data.result[x])
                                        if (args[2] === undefined) {
                                            finalResult.push((parseInt(x) + 1).toString() + ". " + data.result[x].username)
                                        } else {
                                            if (data.result[x].username.toLowerCase() === args[2].toLowerCase()) {
                                                playerStats = data.result[x];
                                            }
                                        }
                                    }
                                    if (args[2] === undefined) {
                                        embed.setTitle("Score Leaderboard")
                                            .addField("Leaderboard", finalResult)
                                    } else {
                                        if (playerStats.kdr !== undefined) {
                                            embed.setTitle(args[2] + "'s Daily Player Stats")
                                                .addField("KDR", playerStats.kdr)
                                                .addField("Kills", playerStats.kills)
                                                .addField("Deaths", playerStats.kills)
                                                .addField("Experience", playerStats.experience)
                                        } else {
                                            embed.setTitle("Player on the leaderboard not found")
                                                .setDescription(args[2] + " is not on the Score leaderboard")
                                                .setFooter("an ERROR has occurred");
                                        }
                                    }
                                    msg.edit(embed)
                                })
                            break;
                        default:
                            embed.setTitle("Leaderboard not found")
                                .setDescription("Leaderboard: " + args[1] + ", not found")
                                .setFooter("an ERROR has occurred");
                            msg.edit(embed)
                            break;
                    }
                });
                break;
        }
    }
})

bot.login(token);

//https://gateway.venge.io/?request=get_room&hash=EA44B
//https://gateway.venge.io/?request=find_room

//https://gateway.venge.io/?request=leaderboard&sort=rank
//https://gateway.venge.io/?request=leaderboard&sort=score