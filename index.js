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

    let args = message.content.trim().slice(prefix.length).trim().split(" ", 20);
    console.log(args);
    
    let command = args[0].toLowerCase();
    console.log(command);

    args.shift();
    console.log(args);

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
            leave();
            break;
        case 'join':
            join();
            break;
        case '8ball':
            //ball();
            break;
        case 'pause':
            pause(serverQueue);
            break;
        case 'resume':
            resume(serverQueue);
            break;
        default: return;
    }

    function leave(){
        const VC = message.member.voice.channel;
        VC.leave();
    }
    
    function join(){
        const VC = message.member.voice.channel;
        
        if(!VC){
            message.channel.send('Primero metete a un canal de voz, cabezón');
        }
        else{
            try{
                //let connection = await VC.join();
                //VC.join();
            }catch(err){

            }
        }
    }

    async function execute(message, serverQueue){
        let VC = message.member.voice.channel;

        if(!VC){
            return message.channel.send('Primero metete a un canal de voz, cabezón');
        }
        else{
            let result = await searcher.search(args, { type: "video" });

            //message.channel.send(result.first.url)

            const songInfo = await ytdl.getInfo(result.first.url);

            let song = {
                title: songInfo.videoDetails.title,
                url: songInfo.videoDetails.video_url,
                duration : songInfo.videoDetails.duration
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
                    return message.channel.send(`No puedo conectarme ${err}`)
                }
            }else{
                serverQueue.songs.push(song);
                return message.channel.send(`Se ha añadido a la lista ${song.url}`);
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
        serverQueue.txtChannel.send(`Se está reproduciendo ${serverQueue.songs[0].url}`)
    }

    function stop(message, serverQueue){
        
        if(!message.member.voice.channel){
            return message.channel.send('Primero metete a un canal de voz, cabezón');
        }
        if(!serverQueue){
            return message.channel.send('No hay nada en reproducción');
        }else{
            serverQueue.songs = [];
            serverQueue.connection.dispatcher.end();
            message.channel.send('Hasta la próxima!');
        }
    }

    function skip (message, serverQueue){
        if(!message.member.voice.channel){
            return message.channel.send('Primero metete a un canal de voz, cabezón');
        }
        if(!serverQueue){
            return message.channel.send('No hay nada que reproducir');
        }
        serverQueue.connection.dispatcher.end();
        
    }

    function pause(serverQueue){
        if(!serverQueue){
            return message.channel.send('No hay nada en reproducción');
        }else{
            if(!serverQueue.connection){
                return message.channel.send('No hay nada en reproducción');
            }else{
                if(serverQueue.connection.dispatcher.paused){
                    return message.channel.send('Ya está pausada');
                }else{
                    serverQueue.connection.dispatcher.pause();
                    message.channel.send('Se ha pausado la cacnción')
                }
            }
        }
        if(!message.member.voice.channel){
            return message.channel.send('No estás en un canal de voz');
        }
    }

    function resume(serverQueue){
        if(!serverQueue){
            return message.channel.send('No hay nada en reproducción');
        }else{
            if(!serverQueue.connection){
                return message.channel.send('No hay nada en reproducción');
            }else{
                if(serverQueue.connection.dispatcher.playing){
                    return message.channel.send('La cacnción ya se está reproduciendo');
                }else{
                    serverQueue.connection.dispatcher.resume();
                    message.channel.send('Se ha resumido la canción')
                }
            }
        }
        if(!message.member.voice.channel){
            return message.channel.send('No estás en un canal de voz');
        }
    }

    function ball(){
        var random = Math.random()
        

          //message.reply('Have you seen JoJo?'); this will print an @ to the user as well as the message
        switch(random){
            case 1:message.channel.send('No');
                break;
            case 2:message.channel.send('Sí');
                break;
            case 3:message.channel.send('Talvez');
                break;
            case 4:message.channel.send('Probablemente');
                break;
            case 5:message.channel.send('No lo creo');
                break;
            case 6:message.channel.send('Definitivamente');
                break;
            case 7:message.channel.send('No lo sé');
                break;
            case 8:message.channel.send('Definitivamente no');
                break;
            case 9:message.channel.send('No cuentes con ello');
                break;
            case 10:message.channel.send('Quizas');
                break;
        }
    }
    
        
}
);