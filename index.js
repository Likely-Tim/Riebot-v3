require("dotenv").config();
const fs = require("fs");
const keepAlive = require("./server");
const refreshSlashCommands = require("./SlashRefresh");
const {Client, Collection, Intents} = require("discord.js");
const client = new Client({
  intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_VOICE_STATES],
});
const {Player} = require("discord-music-player");
const player = new Player(client);
client.player = player;

const {spotifyButtonInteraction} = require("./commands/spotify.js");
const {spotifyPlayingButtonInteraction} = require("./commands/spotify-playing.js");
const {spotifyTopButtonInteraction} = require("./commands/spotify-top.js");
const {animeShowButtonInteraction, animeVAButtonInteraction, animeSearchInteraction} = require("./commands/anime.js");
const file = require("./helpers/file.js");
const {tttButtonInteraction} = require("./commands/ttt.js");

// Databases
const dbInteractions = require("./databaseHelpers/messageInteractions.js");

refreshSlashCommands();
client.commands = new Collection();
const commandFiles = fs.readdirSync("./commands").filter((file) => file.endsWith(".js"));

for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  client.commands.set(command.data.name, command);
}

client.once("ready", () => {
  const logStartPromise = logStartUp();
  const initializingPromise = reinitializeMessages(client);
  Promise.all([logStartPromise, initializingPromise])
    .then(() => {
      console.log("Ready!");
    })
    .catch((error) => {
      console.log(error);
    });
});

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isCommand()) return;
  const {commandName, user} = interaction;
  if (!client.commands.has(commandName)) return;

  try {
    const query = await client.commands.get(commandName).execute(client, interaction);
    file.prepend("./web/saved/command_log.txt", `${user.username}#${user.discriminator},${commandName},${query}\n`);
  } catch (error) {
    console.error(error);
    return interaction.reply({
      content: "There was an error while executing this command!",
    });
  }
});

client.on("messageCreate", async (message) => {
  if (message.type == "CHANNEL_PINNED_MESSAGE" && message.author.id == 876282017149505537n) {
    message.delete();
  }
  if (message.author.bot == false) {
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
keepAlive();
client.login(process.env.DISCORD_TOKEN);

// / ///////////////////////////////////////
// / //////// HELPER FUNCTIONS /////////////
// / ///////////////////////////////////////

async function reinitializeMessages(client) {
  const promises = [];
  const functionMap = messageMapper();
  for (const key of functionMap.keys()) {
    const channel = dbInteractions.get(key + "_channelId");
    const message = dbInteractions.get(key + "_messageId");
    const results = await Promise.all([channel, message]);
    const promise = buttonInteractions(client, results[0], results[1], functionMap.get(key), key);
    promises.push(promise);
  }
  await Promise.all(promises);
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
    console.log(`[${key}] Could not find previous message.`);
  }
}

function messageMapper() {
  const map = new Map();
  map.set("spotify-artist", spotifyButtonInteraction);
  map.set("spotify-track", spotifyButtonInteraction);
  map.set("spotify-album", spotifyButtonInteraction);
  map.set("spotify-playing", spotifyPlayingButtonInteraction);
  map.set("spotify-top", spotifyTopButtonInteraction);
  map.set("anime-show", animeShowButtonInteraction);
  map.set("anime-showSearch", animeSearchInteraction);
  map.set("anime-va", animeVAButtonInteraction);
  map.set("ttt", tttButtonInteraction);
  return map;
}

async function logStartUp() {
  const options = {
    timezone: "America/Los_Angeles",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
  };
  let time = new Date().getTime();
  time -= 3600000 * 7;
  fs.writeFile("StartUpTime.txt", new Date(time).toLocaleString("en-US", options) + "\n", {flag: "a+"}, consoleError);
}

function consoleError(err) {
  if (err) {
    throw err;
  }
}
