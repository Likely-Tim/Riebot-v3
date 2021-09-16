const fs = require('fs');
const Keyv = require('keyv');
const { KeyvFile } = require('keyv-file');
const keepAlive = require("./server");
const refreshSlashCommands = require("./SlashRefresh");
const { Client, Collection, Intents } = require('discord.js');
const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES] });
const { spotify_button_interaction } = require("./commands/spotify.js");
const { spotify_playing_button_interaction} = require("./commands/spotify-playing.js");
const { spotify_top_button_interaction } = require("./commands/spotify-top.js");

// Databases
const messages = new Keyv({
  store: new KeyvFile({
    filename: `storage/messages.json`,
    encode: JSON.stringify,
    decode: JSON.parse
  })
});

refreshSlashCommands();
client.commands = new Collection();
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
	const command = require(`./commands/${file}`);
	client.commands.set(command.data.name, command);
}

client.once('ready', () => {
  // Log startup time
  let options = { timezone: 'America/Los_Angeles', year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric' };
  let time = new Date().getTime();
  time -= (3600000 * 7);
  fs.writeFile('StartUpTime.txt', new Date(time).toLocaleString('en-US', options) + '\n', { flag: 'a+' }, console_error);
  
  let initializing_promise = reinitialize_messages(client);
  Promise.all([initializing_promise])
  .then((values) => {
    console.log('Ready!');
  })
  .catch((error) => {
    console.log(error);
  });
});


client.on('interactionCreate', async interaction => {
	if (!interaction.isCommand()) return;
	const { commandName } = interaction;
	if (!client.commands.has(commandName)) return;

	try {
		await client.commands.get(commandName).execute(client, interaction);
	} catch (error) {
		console.error(error);
		return interaction.reply({ content: 'There was an error while executing this command!'});
	}
});

client.on('messageCreate', async message => {
  if(message.author.bot == false) {
    let content = message.content;
    if(content.startsWith('https://open.spotify.com/track/')) {
      fs.writeFile("./web/saved/spotify.txt", content.replace("https://open.spotify.com/track/", "") + '\n', { flag: 'a+' }, err => {
      if(err) {
        console.log(err);
        return;
      }});
    } else if(content.startsWith('https://www.youtube.com/watch')) {
      content = content.replace('https://www.youtube.com/watch', '');
      let parameters = new URLSearchParams(content);
      if(parameters.has('v')) {
        fs.writeFile("./web/saved/youtube.txt", parameters.get('v') + '\n', { flag: 'a+' }, err => {
        if(err) {
          console.log(err);
          return;
        }});
      }
    } else if(content.startsWith('https://youtu.be/')) {
      let start = content.lastIndexOf('/');
      let end = content.indexOf('?');
      if(end == -1) {
        content = content.substr(start + 1);
      } else {
        content = content.substr(start + 1, end - start - 1);
      }
      fs.writeFile("./web/saved/youtube.txt", content + '\n', { flag: 'a+' }, err => {
      if(err) {
        console.log(err);
        return;
      }});
    }
  }
});

// client.on('debug', console.log);
keepAlive();
client.login(process.env['TOKEN']);

//////////////////////////////////////////
/////////// HELPER FUNCTIONS /////////////
//////////////////////////////////////////

async function reinitialize_messages(client) {
  let promises = [];
  let function_map = message_mapper();
  for(let key of function_map.keys()) {
    let channel = messages.get(key + "_channel_id");
    let message = messages.get(key + "_message_id");
    let results = await Promise.all([channel, message]);
    let promise = button_interactions(client, results[0], results[1], function_map.get(key), key);
    promises.push(promise);
  }
  await Promise.all(promises);
}

async function button_interactions(client, channel_id, message_id, initializer, key) {
  try {
    const channel = await client.channels.fetch(channel_id);
    const message = await channel.messages.fetch(message_id);
    initializer(client, message); 
  } catch (error) {
    console.log(`[${key}] Could not find previous message.`);
  }
}

function message_mapper() {
  const map = new Map();
  map.set("spotify", spotify_button_interaction);
  map.set("spotify-playing", spotify_playing_button_interaction);
  map.set("spotify-top", spotify_top_button_interaction);
  return map;
}

function console_error(err) {
  if(err) {
    throw err;
  }
}