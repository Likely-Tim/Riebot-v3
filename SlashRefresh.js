const fs = require("fs");
const {logger} = require("./utils/logger.js");
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
      logger.info("Started refreshing application (/) commands");

      await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), {
        body: commands,
      });

      logger.info("Successfully reloaded application (/) commands");
    } catch (error) {
      logger.error(error);
    }
  })();
}

module.exports = refreshSlashCommands;
