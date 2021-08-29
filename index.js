const fs = require('fs');
const keepAlive = require("./server");
const refreshSlashCommands = require("./SlashRefresh");
const { Client, Collection, Intents } = require('discord.js');
const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES] });

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
  // TODO: Disable previous messages

  console.log('Ready!');
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

// client.on('debug', console.log);
keepAlive();
client.login(process.env['TOKEN']);

//////////////////////////////////////////
/////////// HELPER FUNCTIONS /////////////
//////////////////////////////////////////

function console_error(err) {
  if(err) {
    throw err;
  }
}