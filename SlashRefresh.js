const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const TOKEN = process.env['TOKEN']
const fs = require('fs');

function refreshSlashCommands() {
  const commands = [];
  const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

  const clientId = "876282017149505537";
  const guildId = "746199520592920597";

  for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    commands.push(command.data.toJSON());
  }

  const rest = new REST({ version: '9' }).setToken(TOKEN);

  (async () => {
    try {
      console.log('Started refreshing application (/) commands.');

      await rest.put(
        Routes.applicationGuildCommands(clientId, guildId),
        { body: commands },
      );

      console.log('Successfully reloaded application (/) commands.');
    } catch (error) {
      console.error(error);
    }
  })();
}

module.exports = refreshSlashCommands;