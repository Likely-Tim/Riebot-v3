const fs = require("fs");
const {REST} = require("@discordjs/rest");
const {Routes} = require("discord-api-types/v9");

const TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.DISCORD_CLIENT_ID;
const GUILD_ID = process.env.DISCORD_GUILD_ID;

function refreshSlashCommands() {
  const commands = [];
  const commandFiles = fs.readdirSync("./commands").filter((file) => file.endsWith(".js"));

  for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    commands.push(command.data.toJSON());
  }

  const rest = new REST({version: "9"}).setToken(TOKEN);

  (async () => {
    try {
      console.log("Started refreshing application (/) commands.");

      await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), {
        body: commands,
      });

      console.log("Successfully reloaded application (/) commands.");
    } catch (error) {
      console.error(error);
    }
  })();
}

module.exports = refreshSlashCommands;
