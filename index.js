require("dotenv").config();
const fs = require("fs");
const initializeServer = require("./server.js");
const {logger, startUpLogger} = require("./utils/logger.js");
const refreshSlashCommands = require("./SlashRefresh");

// Discord JS
const {Client, Collection, Intents} = require("discord.js");
const client = new Client({
  intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_VOICE_STATES],
});

// Discord music player
const {Player} = require("discord-music-player");
const player = new Player(client);
client.player = player;

// Reinitialize old command interactions
const {spotifyButtonInteraction} = require("./commands/spotify.js");
const {spotifyPlayingButtonInteraction} = require("./commands/spotify-playing.js");
const {spotifyTopButtonInteraction} = require("./commands/spotify-top.js");
const {animeShowButtonInteraction, animeVAButtonInteraction, animeSearchInteraction} = require("./commands/anime.js");

const tesseract = require("./js/tesseract-ocr");

// Databases
const dbInteractions = require("./databaseUtils/messageInteractions.js");

startUpLogger.info("Start Up");
refreshSlashCommands();
client.commands = new Collection();
const commandFiles = fs.readdirSync("./commands").filter((file) => file.endsWith(".js"));

for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  client.commands.set(command.data.name, command);
}

client.once("ready", async () => {
  logger.info("Discord Client Starting Up");
  await reinitializePreviousCommands(client);
  logger.info("Discord Client Ready");
});

client.on("interactionCreate", async (interaction) => {
  // Interaction is not a command
  if (!interaction.isCommand()) {
    return;
  }
  // Check if Riebot-v3's command
  const {commandName, user} = interaction;
  if (!client.commands.has(commandName)) {
    return;
  }
  // Execute Riebot-v3 command
  try {
    await client.commands.get(commandName).execute(client, interaction);
  } catch (error) {
    logger.error(error);
    return interaction.reply({
      content: "There was an error while executing this command!",
    });
  }
});

client.on("messageCreate", async (message) => {
  // Delete pinned message notification if Riebot-v3
  if (message.type == "CHANNEL_PINNED_MESSAGE" && message.author.id == 876282017149505537n) {
    message.delete();
  }
  if (message.author.bot == false) {
    const messageAttachmentArray = Array.from(message.attachments.values());
    if (messageAttachmentArray.length != 0) {
      tesseract.tesseractExtractText(messageAttachmentArray);
    }
    let content = message.content;
    if (content.startsWith("https://open.spotify.com/track/")) {
      fs.writeFile("./web/saved/spotify.txt", content.replace("https://open.spotify.com/track/", "") + "\n", {flag: "a+"}, (err) => {
        if (err) {
          console.log(err);
        }
      });
    } else if (content.startsWith("https://www.youtube.com/watch")) {
      content = content.replace("https://www.youtube.com/watch", "");
      const parameters = new URLSearchParams(content);
      if (parameters.has("v")) {
        fs.writeFile("./web/saved/youtube.txt", parameters.get("v") + "\n", {flag: "a+"}, (err) => {
          if (err) {
            console.log(err);
          }
        });
      }
    } else if (content.startsWith("https://youtu.be/")) {
      const start = content.lastIndexOf("/");
      const end = content.indexOf("?");
      if (end == -1) {
        content = content.substr(start + 1);
      } else {
        content = content.substr(start + 1, end - start - 1);
      }
      fs.writeFile("./web/saved/youtube.txt", content + "\n", {flag: "a+"}, (err) => {
        if (err) {
          console.log(err);
        }
      });
    }
  }
});

// client.on('debug', console.log);
initializeServer();
client.login(process.env.DISCORD_TOKEN);

//////////////////////////////////////////
/////////// HELPER FUNCTIONS /////////////
//////////////////////////////////////////

async function reinitializePreviousCommands(client) {
  logger.info("Reinitializing Previous Commands");
  const promises = [];
  const functionMap = commandFunctionMapper();
  for (const key of functionMap.keys()) {
    const channel = dbInteractions.get(key + "_channelId");
    const message = dbInteractions.get(key + "_messageId");
    const results = await Promise.all([channel, message]);
    const promise = buttonInteractions(client, results[0], results[1], functionMap.get(key), key);
    promises.push(promise);
  }
  await Promise.all(promises);
  logger.info("Finished Reinitializing Previous Commands");
}

async function buttonInteractions(client, channelId, messageId, initializer, key) {
  try {
    const channel = await client.channels.fetch(channelId);
    const message = await channel.messages.fetch(messageId);
    if (key.startsWith("spotify-")) {
      initializer(client, message, key.split("-")[1]);
    } else {
      initializer(client, message);
    }
  } catch (error) {
    logger.info(`[${key}] Could not find previous message.`);
  }
}

function commandFunctionMapper() {
  const map = new Map();
  map.set("spotify-artist", spotifyButtonInteraction);
  map.set("spotify-track", spotifyButtonInteraction);
  map.set("spotify-album", spotifyButtonInteraction);
  map.set("spotify-playing", spotifyPlayingButtonInteraction);
  map.set("spotify-top", spotifyTopButtonInteraction);
  map.set("anime-show", animeShowButtonInteraction);
  map.set("anime-showSearch", animeSearchInteraction);
  map.set("anime-va", animeVAButtonInteraction);
  return map;
}
