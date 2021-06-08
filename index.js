const {excecutionAsyncResource} = require('async_hooks');

const Discord = require('discord.js');

const client = new Discord.Client();

const ytdl = require('ytdl-core');

const {YTSearcher} = require('ytsearcher');

const searcher = new YTSearcher({
    key: process.env.youtube_api,
    revealed: true
});

const prefix = 'v!';

var myToken = process.env.token;

client.login(myToken);

const queue = new Map();

client.on("ready", () => {
    console.log("I am online");
})

client.on('message' , (message) =>
{   
    if (!message.content.startsWith(prefix) || message.author.bot) return;

    const serverQueue = queue.get(message.guild.id);

    let args = message.content.trim().slice(prefix.length).trim().split(" ");
    console.log(args);

    let command = args[0].toLowerCase();
    console.log(command);

    args[0] = '';
    args = args.join(' ').trim();
    console.log(args);

    /*
    let args = message.content.trim().slice(prefix.length).trim().split(" ", 20);
    console.log(args);
    
    let command = args[0].toLowerCase();
    console.log(command);
    args.shift();
    args.toString()
    console.log(args);
    */

    switch(command){

        case 'play':
            execute(message, serverQueue);
            break;
        case 'stop':
            stop(message, serverQueue);
            break;
        case 'skip':
            skip(message, serverQueue);
            break;
        case 'leave':
            break;
        case '8ball':
            ball();
            break;
        case 'pause':
            pause(message, serverQueue);
            break;
        case 'resume':
            resume(message, serverQueue);
            break;
        case 'help':
            help();
            break;
        case 'cs':
            currentSong(serverQueue);
            break;
        case '?':
            quien();
            break;
        case 'profile':
            profile(message);
            break;
        case 'nick':
            nick(args);
            break;
        case 'fr':
            fr();
            break;
        default: return;
    }

    async function execute(message, serverQueue){
        let VC = message.member.voice.channel;

        if(!VC){
            return message.channel.send('You need to join a voice channel first');
        }
        else{
            //args = message.content.trim().slice(prefix.length + command.length).trim().toString();
            //console.log(args);
            if(!args.length){
                return message.channel.send('You need to enter a parameter');
            }

            let result = await searcher.search(args, { type: "video" });

            if(!result){
                return message.channel.send('Could not find the song');
            }else{
                const songInfo = await ytdl.getInfo(result.first.url);

                let song = {
                    title: songInfo.videoDetails.title,
                    url: songInfo.videoDetails.video_url,
                    duration: songInfo.videoDetails.duration
                };

                if(!serverQueue){
                    const queueConstructor = {
                        txtChannel: message.channel,
                        vChannel: VC,
                        connection: null,
                        songs: [],
                        volume: 10,
                        playing: true
                    };
                    queue.set(message.guild.id, queueConstructor);
                
                    queueConstructor.songs.push(song);

                    try{
                        let connection = await VC.join();
                        queueConstructor.connection = connection;
                        play(message.guild, queueConstructor.songs[0]);
                    }catch(err){
                        console.error(err);
                        queue.delete(message.guild.id);
                        return message.channel.send(`I cannot connect ${err}`)
                    }
                }else{
                    serverQueue.songs.push(song);
                    return message.channel.send(`${song.title} has been added to queue 👍`);
                }
            }
        }
    }

    function play(guild, song){
        const serverQueue = queue.get(guild.id);
        if(!song){
            serverQueue.vChannel.leave();
            queue.delete(guild.id);
            return;
        }
        const dispatcher = serverQueue.connection
            .play(ytdl(song.url))
            .on('finish', () => {
            serverQueue.songs.shift();
            play(guild, serverQueue.songs[0])
            
            })
            
        serverQueue.txtChannel.send(`**${serverQueue.songs[0].title}** is being played! 🤩`)
    }

    function stop(message, serverQueue){
        if(!message.member.voice.channel){
            return message.channel.send('You need to join a voice channel first');
        }
        if(!serverQueue){
            return message.channel.send('There is nothing playing');
        }else{
            if(serverQueue.connection){
                if(serverQueue.connection.dispatcher.paused){
                    serverQueue.connection.dispatcher.resume();
                }
                serverQueue.songs = [];
                if(serverQueue.connection){
                    if(serverQueue.connection.dispatcher){
                        serverQueue.connection.dispatcher.end();
                        return message.channel.send('👋 Succesfully disconnected');
                    }else{
                        return message.channel.send('No song is being played');
                    }
                }
            }
        }
        
    }

    function currentSong(serverQueue){
        if(!message.member.voice.channel){
            return message.channel.send('You need to join a voice channel first');
        }
        if(!serverQueue){
            return message.channel.send('There is nothing playing');
        }else{
            if(serverQueue.connection){
                if(serverQueue.connection.dispatcher){
                    return message.channel.send(`**${serverQueue.songs[0].title}** is being played! 🤩`);
                }
            }
        }
        
    }

    function skip (message, serverQueue){
        if(!message.member.voice.channel){
            return message.channel.send('You need to join a voice channel first');
        }
        if(!serverQueue){
            return message.channel.send('There are no songs in queue 😔');
        }
        if(!serverQueue.connection){
            message.channel.send('There are no more songs in the queue');
        }else{
            if(serverQueue.connection.dispatcher){
                serverQueue.connection.dispatcher.end();
                return message.channel.send('Song skipped ✌');
            }else{
                return message.channel.send('No song is being played');
            }
        }
    }

    function pause(message, serverQueue){
        if(!message.member.voice.channel){
            return message.channel.send('You need to join a voice channel first');
        }
        if(!serverQueue){
            return message.channel.send('There is nothing playing');
        }else{
            if(!serverQueue.connection){
                return message.channel.send('There is nothing playing');
            }else{
                if(serverQueue.connection.dispatcher){
                    if(serverQueue.connection.dispatcher.paused){
                        return message.channel.send('The song is already paused');
                    }else{
                        serverQueue.connection.dispatcher.pause();
                        return message.channel.send('The song has been paused')
                    }
                }else{
                    return message.channel.send('There is nothing to play');
                }
            }
        }
        
    }

    function resume(message, serverQueue){
        if(!message.member.voice.channel){
            return message.channel.send('You need to join a voice channel first');
        }
        if(!serverQueue){
            return message.channel.send('There is nothing to play');
        }else{
            if(!serverQueue.connection){
                return message.channel.send('There is nothing to play');
            }else{
                if(serverQueue.connection.dispatcher){
                    if(serverQueue.connection.dispatcher.playing){
                        return message.channel.send('The song is already playing');
                    }else{
                        serverQueue.connection.dispatcher.resume();
                        return message.channel.send('Song has been resumed')
                    }
                }else{
                    return message.channel.send('There is nothing to play');
                }
                
            }
        }
        
    }
    
    function quien(){
        var random = randomNum(1, 7);
        
        
        switch(random){
            case 1: return message.channel.send('Vos le preguntaste?');
                break;
            case 2: return message.channel.send('Casi te preguntamos, crack.');
                break;
            case 3: message.channel.send('y decime... quién te pregunto?');
                break;
            case 4: message.channel.send('Buen dato. Hubiera sido genial si te lo hubieran preguntado');
                break;
            case 5: message.channel.send('Debo tener alzheimer porque no recuerdo que te hayan preguntado');
                break;
            case 6: message.channel.send('A lo mejor estoy sordo y ciego pero no sé quien te pregunto');
                break;
            case 7: message.channel.send('Que lastima que no lo hayamos preguntado');
                break;
        }
    }

    function ball(){
        var random = randomNum(1, 21);
        

          //message.reply('Have you seen JoJo?'); this will print an @ to the user as well as the message
        switch(random){
            case 1: message.channel.send('No');
                break;
            case 2: message.channel.send('Yes');
                break;
            case 3: message.channel.send('Is possible');
                break;
            case 4: message.channel.send('Probably');
                break;
            case 5: message.channel.send('I believe not');
                break;
            case 6: message.channel.send('Definitely');
                break;
            case 7: message.channel.send('I dunno');
                break;
            case 8: message.channel.send('Definitely not');
                break;
            case 9: message.channel.send('Do not count on it');
                break;
            case 10:message.channel.send('Maybe');
                break;
            case 11:message.channel.send('The odds are in favor');
                break;
            case 12:message.channel.send('The odds are against you');
                break;
            case 13:message.channel.send('I do not think so');
                break;
            case 14:message.channel.send('I would say no');
                break;
            case 15:message.channel.send('Try Again');
                break;
            case 16:message.channel.send('It is certain');
                break;
            case 17:message.channel.send('My sources say no');
                break;
            case 18:message.channel.send('Outlook not so good');
                break;
            case 19:message.channel.send('Signs point to yes');
                break;
            case 20:message.channel.send('It is decidedly so');
                break;
            case 21:message.channel.send('Stars say yes');
                break;
        }
    }

    function profile(message){
        if (message.attachments.size > 0) {
            if (message.attachments.first(attachIsImage)){
                image = message.attachments.first().url;
                client.user.setAvatar(image);
            }
        }
    }
        
    function attachIsImage(msgAttach) {
        var url = msgAttach.url;
        //True if this url is a png image.
        return url.indexOf("png", url.length - "png".length /*or 3*/) !== -1;
    }
    
    function randomNum(min, max){
        return Math.floor(Math.random() * (max - min + 1) + min);
    }
    
    function nick(args){
        if(!args.length){
            return message.channel.send('You need to enter a parameter');
        }
        client.user.setUsername(args);
    }

    function fr(){
        const frembed = new Discord.MessageEmbed()
        .setColor('#228B22')
        .setDescription(`**Miku Nakano** \n \n5-toubun no Hanayome ♀️\n_Animanga roulette_ · 1009\nClaim Rank: #21\nLike Rank: #30\nNakano Miku`)
        .setImage(`https://images-ext-1.discordapp.net/external/IsFaoacboZNuzrKp-jrPqYrUN-KgT5EDqfBupmBpURo/https/media.discordapp.net/attachments/472313197836107780/747636059499921448/eYM3oYp.png`)
        .setFooter(`Belongs to 4Channer promedio`)
        message.channel.send(`Wished by <@718998542030733362>, <@402521092796710915>`,{embed: frembed}).then(sentEmbed => {
    sentEmbed.react("❤")
})
    }
    
    function help(){
        const embed = new Discord.MessageEmbed()
    .setTitle(`HELP`)
    .setColor(0xCF40FA)
    .setDescription(`List of commands below.`)
    .addField(`**Commands**`, `play   - Reproduces the song specified (name or URL)\n stop   - Disconnects the bot and resets queue\n skip   - Skips to the next song in queue\n pause  - Pauses the playing song \n resume - Resumes pauses \n cs - Shows current song \n 8ball  - Gives answers to your questions`, true)
    message.channel.send({ embed: embed });
    }
}
);
