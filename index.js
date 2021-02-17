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
        case 'song':
            song(message, serverQueue);
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
        

        if(!serverQueue){
            return message.channel.send('There is nothing playing');
        }else{
            if(serverQueue.connection){
                if(serverQueue.connection.dispatcher.paused){
                    serverQueue.connection.dispatcher.resume();
                }
                serverQueue.songs = [];
                if(serverQueue.connection){
                    serverQueue.connection.dispatcher.end();
                    message.channel.send('👋 Succesfully disconnected');
                }
            }
        }
        if(!message.member.voice.channel){
            return message.channel.send('You need to join a voice channel first');
        }
    }

    function skip (message, serverQueue){
        if(!message.member.voice.channel){
            return message.channel.send('You need to join a voice channel first');
        }
        if(!serverQueue){
            return message.channel.send('There are no songs in queue 😔');
        }
        
        serverQueue.connection.dispatcher.end();
        message.channel.send('Song skipped ✌');

        if(!serverQueue.connection){
            message.channel.send('There are no more songs in the queue');
        }
    }

    function pause(message, serverQueue){
        if(!serverQueue){
            return message.channel.send('There is nothing playing');
        }else{
            if(!serverQueue.connection){
                return message.channel.send('There is nothing playing');
            }else{
                if(serverQueue.connection.dispatcher.paused){
                    return message.channel.send('The song is already paused');
                }else{
                    serverQueue.connection.dispatcher.pause();
                    message.channel.send('The song has been paused')
                }
            }
        }
        if(!message.member.voice.channel){
            return message.channel.send('You need to join a voice channel first');
        }
    }

    function resume(message, serverQueue){
        if(!serverQueue){
            return message.channel.send('There is nothing to play');
        }else{
            if(!serverQueue.connection){
                return message.channel.send('There is nothing to play');
            }else{
                if(serverQueue.connection.dispatcher.playing){
                    return message.channel.send('The song is already playing');
                }else{
                    serverQueue.connection.dispatcher.resume();
                    message.channel.send('Song has been resumed')
                }
            }
        }
        if(!message.member.voice.channel){
            return message.channel.send('You need to join a voice channel first');
        }
    }

    function song(message, serverQueue){
        if(!serverQueue){
            return message.channel.send('No song is being played');
        }
        if(!serverQueue.connection){
            return message.channel.send('No song is being played');
        }else{
            if(serverQueue.connection.dispatcher.playing || serverQueue.connection.dispatcher.paused){
                return message.channel.send(`🎶🎵**SONG**🎶🎵 \n Current song: **${serverQueue.songs[0].title}** \n url: ${serverQueue.songs[0].url}`);
            }
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

    function randomNum(min, max){
        return Math.floor(Math.random() * (max - min + 1) + min);
    }

    function help(){
        const embed = new Discord.MessageEmbed()
    .setTitle(`HELP`)
    .setColor(0xCF40FA)
    .setDescription(`List of commands below.`)
    .addField(`**Commands**`, `play   - Reproduces the song specified (name or URL)\n stop   - Disconnects the bot and resets queue\n skip   - Skips to the next song in queue\n pause  - Pauses the playing song \n resume - Resumes pauses\n song   - Gives current song's info \n 8ball  - Gives answers to your questions`, true)
    message.channel.send({ embed: embed });
    }
}
);