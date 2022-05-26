const mineflayer = require('mineflayer')
const express = require("express")
const tokens = require('prismarine-tokens-fixed')
const fs = require('fs')
const app = express()
require('express-ws')(app)

app.set("view engine", "ejs")
app.use(express.static('views'))
app.use(express.urlencoded({extended: false}))

var bots = []
var settings = {turning:false,spaming:false,scripting:false}
var stats = []

app.ws('/ws', (ws, req) => {
    websocket = ws
    ws.on('message', (msg) => {
        console.log(msg)
        msg = JSON.parse(msg)
        if (msg.action == "say") {
            ws.send("Talking")
            say(msg)
        } else if (msg.action == "join") {
            ws.send("Joining " + msg.serverip)
            join(msg.serverip,msg.maxbots,msg.version,msg.credentials,msg.joindelay,0,msg.spawnmsg)
        } else if (msg.action == "simple") {
            ws.send("Doing Some Simple Stuff")
            simple(msg.method,msg.start)
        } else if (msg.action == "script") {
            ws.send("Started script")
            script()
        }
    })
})

app.post("/",(req,res)=>{
    res.render("index.html")
    res.end()
})

function script() {
    var script = require("./script.js")
    script.main(bots)
}

function say(body) {
    if (body.say == true) {
        bots.forEach((bot,index)=>{
            setTimeout(()=>{
                bot.chat(body.message)
            },Number(body.delay) * index)
        })
    } else {
        console.log("here")
        settings.spaming = (body.start == true)
        spam(body.message,body.delay)
    }
}

function spam(msg,delay) {
    if (settings.spaming) {
        bots.forEach((bot,index)=>{
            bot.chat(msg)
        })
        setTimeout(()=>{
            spam(msg,delay)
        },delay)
    }
}

function simple(method,start) {
    if (method == "turn") {
        settings.turning = start
        turnaround()
    }
    if (method == "walk") {
        bots.forEach((bot)=>{
            bot.setControlState('forward', start)
        })
    }
    if (method == "sneak") {
        bots.forEach((bot)=>{
            bot.setControlState('sneak', start)
        })
    }
}

function turnaround() {
    bots.forEach((bot)=>{
        bot.look(Math.random()*100,Math.random()-0.5)
    })
    if (settings.turning == true) {
        setTimeout(()=>{
            turnaround()
        },3000)
    }
}

function join(serverip,maxbots,version,credentials,joindelay,index,spawnmsg) {
    index += 1
    if (credentials == "") {
        var data = fs.readFileSync('names.txt', 'utf8').split("\n")
        var name = data[Math.floor(Math.random() * data.length)] + Math.round((Math.random() * 1000))
    } else {
        if ( typeof credentials.split("\n")[index-1] == 'undefined') {return}
        var nap = credentials.split("\n")[index-1].split(":")
        var name = nap[0]
        var password = nap[1]
    }
    if (version == "auto") {version=null}
    var options = {
        host: serverip.split(":")[0],
        port: parseInt(serverip.split(":")[1]) || 25565,
        username: name,
        password: password || null,
        version: version,
        tokensLocation: 'tokens.json'
    }
    tokens.use(options, (err, opts) => {
        var bot = mineflayer.createBot(opts);
        
        bot.once("spawn",()=>{
            bots.push(bot)
            if (typeof password !== 'undefined') {
                websocket.send("spawned in as " + bot.username)
                console.log ("logged and spawned in as " + bot.username + " using " + nap[0] + ":" + nap[1])
            } else {
                console.log ("logged and spawned in as " + bot.username)
            }
            stats.push({
                name: bot.username,
                deaths: 0,
                kills: 0,
                messagesend: 0,
                messagesreceived: 0
            })
            
            setTimeout(()=>{
                bot.chat(spawnmsg)
            },500)

            bot.on("spawn",()=>{
                console.log(bot.username + " is at " + bot.entity.position)
            })
            bot.on("chat",(ign,msg)=>{
                console.log(ign + ": " + msg)
            })
            bot.on("kicked",(reason)=>{console.log(bot.username + " got kicked for " + reason)})
        })
    })
    if (index < maxbots) {
        setTimeout(()=>{
            join(serverip,maxbots,version,credentials,joindelay,index,spawnmsg)
        },joindelay)
    }
}


function randomstring(length) {
    var result = ''
    var characters = 'ABCDEFGHJKLMNOPQRSTUVWXYZabcdeghjmnopqrsuvwxyz_'
    var charactersLength = characters.length
    for ( var i = 0; i < length; i++ ) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength))
    }
    return result
}


app.listen(8000)
console.log("   /\\\\\\\\\\\\\\\\\\      /\\\\\\\\\\\\\\\\\\\\\\        /\\\\\\\\\\\\\\\\\\  /\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\            /\\\\\\        /\\\\\\    /\\\\\\\\\\\\\\\\\\               /\\\\\\\\\\\\\\            \n  /\\\\\\///////\\\\\\   \\/////\\\\\\///      /\\\\\\////////  \\/\\\\\\///////////            \\/\\\\\\       \\/\\\\\\  /\\\\\\///////\\\\\\           /\\\\\\/////\\\\\\         \n  \\/\\\\\\     \\/\\\\\\       \\/\\\\\\       /\\\\\\/           \\/\\\\\\                       \\//\\\\\\      /\\\\\\  \\///      \\//\\\\\\         /\\\\\\    \\//\\\\\\       \n   \\/\\\\\\\\\\\\\\\\\\\\\\/        \\/\\\\\\      /\\\\\\             \\/\\\\\\\\\\\\\\\\\\\\\\                \\//\\\\\\    /\\\\\\             /\\\\\\/         \\/\\\\\\     \\/\\\\\\      \n    \\/\\\\\\//////\\\\\\        \\/\\\\\\     \\/\\\\\\             \\/\\\\\\///////                  \\//\\\\\\  /\\\\\\           /\\\\\\//           \\/\\\\\\     \\/\\\\\\     \n     \\/\\\\\\    \\//\\\\\\       \\/\\\\\\     \\//\\\\\\            \\/\\\\\\                          \\//\\\\\\/\\\\\\         /\\\\\\//              \\/\\\\\\     \\/\\\\\\    \n      \\/\\\\\\     \\//\\\\\\      \\/\\\\\\      \\///\\\\\\          \\/\\\\\\                           \\//\\\\\\\\\\        /\\\\\\/                 \\//\\\\\\    /\\\\\\    \n       \\/\\\\\\      \\//\\\\\\  /\\\\\\\\\\\\\\\\\\\\\\    \\////\\\\\\\\\\\\\\\\\\ \\/\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\                \\//\\\\\\        /\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\  /\\\\\\  \\///\\\\\\\\\\\\\\/    \n        \\///        \\///  \\///////////        \\/////////  \\///////////////                  \\///        \\///////////////  \\///     \\///////     ")