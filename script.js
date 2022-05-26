const mineflayer = require('mineflayer')
var navigatePlugin = require('mineflayer-navigate')(mineflayer)

if (1 == 0) {
    bot = mineflayer.createBot({
        host: 'localhost',
        username: 'rice',
        port: 37177
    })
}


function main(bots) {
    bots.forEach((bot,index) => {
        navigatePlugin(bot);
        bot.navigate.on('cannotFind', function (closestPath) {
            bot.chat("unable to find path. getting as close as possible");
            bot.navigate.walk(closestPath);
        })

        bot.navigate.on('arrived', function () {
            bot.chat("I have arrived");
        })
        
        bot.on('chat', (username, message) => {
            if (username === bot.username) return;
            var target = bot.players[username].entity;
            
            if (message === "start") {
                bot.navigate.to(target.position);
            }
        })
    })
}

module.exports = {main}