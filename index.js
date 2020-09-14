fs = require('fs')
var https = require('https');
var http = require('http');
const Discord = require('discord.js');
const client = new Discord.Client();
const statGamemodes = ["skywars","bedwars","uhc","speeduhc","pit","paintball","murdermystery","megawalls","duels","blitz","general"]
const aliases = ["sw", "bw", "uhc"," su","pit","pb","mm","mw","duels","blitz","general"]


fs.readFile('./API-Key.txt', 'utf8', function (err,data) {
    if (err) {
        return console.log(err);
    }
    API_KEY = data;
});
fs.readFile('./hostname.txt', 'utf8', function (err,data) {
    if (err) {
        return console.log(err);
    }
    HOSTNAME = data;
});


var GamemodeStats = function (kd, wl, wins, kills) {
    this._kd = kd;
    this._wl = wl;
    this._wins = wins;
    this._kills = kills;
};

var GamemodeStatsMM = function (kd, wl) {
    this._kd = kd;
    this._wl = wl;
};


function capitalizeFirstLetter(string) {

    return string.charAt(0).toUpperCase() + string.slice(1);
}


client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});
const commandPrefix = ">"
client.on('message', msg => {
    if(msg.channel.id == "754766106018971648" || msg.channel.id == "672211617290911751") {

    if (msg.content[0] == commandPrefix) {
        var messageArguments = msg.content.slice(commandPrefix.length).trim().split(" ");
        if (messageArguments[0] === 'query' && messageArguments[1] != undefined) {
            msg.channel.startTyping();
            var options = {
                host: 'api.mcsrvstat.us',
                path: `/2/${messageArguments[1]}`,
                method: 'GET'
            };

            callback = function (response) {
                var str = '';

                response.on('data', function (chunk) {
                    str += chunk;
                });

                response.on('end', function () {
                    const serverObj = JSON.parse(str);
                    let responseEmbed;
                    if (serverObj.online === true) {
                        responseEmbed = new Discord.MessageEmbed()
                            .setColor('#3e8ef7')
                            .setTitle(`Server Status: ${messageArguments[1]}`)
                            .setDescription(`${serverObj.motd.clean[0] != undefined ? serverObj.motd.clean[0] : ""}\n${serverObj.motd.clean[1] != undefined ? serverObj.motd.clean[1] : ""}`)
                            .setThumbnail(`https://api.mcsrvstat.us/icon/${messageArguments[1]}`)
                            .addFields(
                                {
                                    name: "Players",
                                    value: `${serverObj.players.online}/${serverObj.players.max}`,
                                    inline: false
                                },
                                {name: 'Version', value: `${serverObj.version}\t`, inline: false},
                                {name: 'IP : PORT', value: `${serverObj.ip} : ${serverObj.port}\t`, inline: false},
                            )
                            .setTimestamp()
                            .setFooter(client.user.username, client.user.displayAvatarURL());
                    } else {
                        responseEmbed = new Discord.MessageEmbed()
                            .setColor('#3e8ef7')
                            .setTitle(`Server Status: ${messageArguments[1]}`)
                            .setDescription(`The server is offline!`)
                            .setThumbnail(`https://api.mcsrvstat.us/icon/${messageArguments[1]}`)
                            .setTimestamp()
                            .setFooter(client.user.username, client.user.avatarURL());
                    }

                    msg.channel.send(responseEmbed).then(() => msg.channel.stopTyping());
                });
            }

            https.request(options, callback).end();



        } else if (statGamemodes.includes(messageArguments[0].toLowerCase()) || aliases.includes(messageArguments[0].toLowerCase())) {
            msg.channel.startTyping();
            let playerName = msg.author.username;
            if (messageArguments[1] != undefined) {
                playerName = messageArguments[1];
            }
            let gamePath = messageArguments[0].toLowerCase();
            if(aliases.includes(messageArguments[0].toLowerCase())) {
                gamePath = statGamemodes[aliases.indexOf(messageArguments[0].toLowerCase())]
            }
            let gamemodeEmbed;
            const options = {
                hostname: HOSTNAME,
                path: `/player/${gamePath}/${playerName}`,
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'API-Key': API_KEY
                }
            }

            const req = http.request(options, res => {
                if (res.statusCode == 200) {
                    res.on('data', d => {
                        const statsObj = JSON.parse(d);
                        process.stdout.write(d)
                        objVals = Object.values(statsObj.stats)
                        let gamemodeEmbed;
                        if(["pit", "paintball","pb"].includes(gamePath)) {
                            var currentStats = new GamemodeStats(objVals[0]);

                            gamemodeEmbed = new Discord.MessageEmbed()
                                .setColor('#3e8ef7')
                                .setTitle(`${capitalizeFirstLetter(playerName)} ${capitalizeFirstLetter(gamePath.toLowerCase())} Stats`)
                                .addFields(
                                    {name: "K/D", value: `Daily: \`${currentStats._kd[0].daily}\`\nWeekly: \`${currentStats._kd[1].weekly}\`\nMonthly: \`${currentStats._kd[2].monthly}\`\nOverall: \`${currentStats._kd[3].overall}\``, inline: true},
                                )
                                .setThumbnail(`https://minotar.net/helm/${playerName}`)
                                .setTimestamp()
                                .setFooter(client.user.username, client.user.avatarURL());

                        } else if(["murdermystery", "speeduhc", "duels","mm","su"].includes(gamePath)) {
                            var currentStats = new GamemodeStats(objVals[0], objVals[1]);

                            gamemodeEmbed = new Discord.MessageEmbed()
                                .setColor('#3e8ef7')
                                .setTitle(`${capitalizeFirstLetter(playerName)} ${gamePath.toLowerCase() === "murdermystery" ? "Murder Mystery" : capitalizeFirstLetter(messageArguments[0].toLowerCase())} Stats`)
                                .addFields(
                                    {name: "K/D", value: `Daily: \`${currentStats._kd[0].daily}\`\nWeekly: \`${currentStats._kd[1].weekly}\`\nMonthly: \`${currentStats._kd[2].monthly}\`\nOverall: \`${currentStats._kd[3].overall}\``, inline: true},
                                    {name: 'W/L', value: `Daily: \`${currentStats._wl[0].daily}\`\nWeekly: \`${currentStats._wl[1].weekly}\`\nMonthly: \`${currentStats._wl[2].monthly}\`\nOverall: \`${currentStats._wl[3].overall}\``, inline: true},
                                )
                                .setThumbnail(`https://minotar.net/helm/${playerName}`)
                                .setTimestamp()
                                .setFooter(client.user.username, client.user.avatarURL());
                        } else if(["skywars", "bedwars","sw","bw"].includes(gamePath)) {
                            var currentStats = new GamemodeStats(objVals[0], objVals[1], objVals[2], objVals[3]);

                            gamemodeEmbed = new Discord.MessageEmbed()
                                .setColor('#3e8ef7')
                                .setTitle(`${capitalizeFirstLetter(playerName)} ${capitalizeFirstLetter(gamePath)} Stats`)
                                .addFields(
                                    {name: "K/D", value: `Daily: \`${currentStats._kd[0].daily}\`\nWeekly: \`${currentStats._kd[1].weekly}\`\nMonthly: \`${currentStats._kd[2].monthly}\`\nOverall: \`${currentStats._kd[3].overall}\``, inline: true},
                                    {name: 'W/L', value: `Daily: \`${currentStats._wl[0].daily}\`\nWeekly: \`${currentStats._wl[1].weekly}\`\nMonthly: \`${currentStats._wl[2].monthly}\`\nOverall: \`${currentStats._wl[3].overall}\``, inline: true},
                                    { name: '\u200B', value: '\u200B' },
                                    {name: 'Wins', value: `Daily: \`${currentStats._wins[0].daily}\`\nWeekly: \`${currentStats._wins[1].weekly}\`\nMonthly: \`${currentStats._wins[2].monthly}\`\nOverall: \`${currentStats._wins[3].overall}\``, inline: true},
                                    {name: 'Kills', value: `Daily: \`${currentStats._kills[0].daily}\`\nWeekly: \`${currentStats._kills[1].weekly}\`\nMonthly: \`${currentStats._kills[2].monthly}\`\nOverall: \`${currentStats._kills[3].overall}\``, inline: true},
                                )

                                .setThumbnail(`https://minotar.net/helm/${playerName}`)
                                .setTimestamp()
                                .setFooter(client.user.username, client.user.avatarURL());
                        } else if(["megawalls","mw"].includes(gamePath)) {
                            var currentStats = new GamemodeStats(objVals[0], objVals[1]);

                            gamemodeEmbed = new Discord.MessageEmbed()
                                .setColor('#3e8ef7')
                                .setTitle(`${capitalizeFirstLetter(playerName)} ${capitalizeFirstLetter(gamePath)} Stats`)
                                .addFields(
                                    {name: "FK/D", value: `Daily: \`${currentStats._kd[0].daily}\`\nWeekly: \`${currentStats._kd[1].weekly}\`\nMonthly: \`${currentStats._kd[2].monthly}\`\nOverall: \`${currentStats._kd[3].overall}\``, inline: true},
                                    {name: 'W/L', value: `Daily: \`${currentStats._wl[0].daily}\`\nWeekly: \`${currentStats._wl[1].weekly}\`\nMonthly: \`${currentStats._wl[2].monthly}\`\nOverall: \`${currentStats._wl[3].overall}\``, inline: true},
                                )

                                .setThumbnail(`https://minotar.net/helm/${playerName}`)
                                .setTimestamp()
                                .setFooter(client.user.username, client.user.avatarURL());
                        }






                        msg.channel.send(gamemodeEmbed).then(() => msg.channel.stopTyping());
                    });


                } else if (res.statusCode == 404) {

                } else if (res.statusCode == 403) {

                }


            })

            req.on('error', error => {
                console.error(error)
            })

            req.end()


        }
    }

}

});

fs.readFile('./token.txt', 'utf8', function (err,data) {
    if (err) {
        return console.log(err);
    }
    client.login(data);
});


