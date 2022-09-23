const fs = require("fs");
const {SlashCommandBuilder} = require("@discordjs/builders");
const {InteractionCollector} = require("discord.js");
const spotify = require("../utils/spotify.js");
const button = require("../utils/buttons.js");

// Databases
const dbInteractions = require("../databaseUtils/messageInteractions.js");
const {logger} = require("../utils/logger.js");

async function disablePrevious(client, newMessage) {
  try {
    const oldChannelId = await dbInteractions.get("spotify-playing_channelId");
    const oldChannel = await client.channels.fetch(oldChannelId);
    const oldMessageId = await dbInteractions.get("spotify-playing_messageId");
    const oldMessage = await oldChannel.messages.fetch(oldMessageId);
    const buttons = button.disableAllButtons(oldMessage.components);
    oldMessage.edit({components: buttons});
  } catch (error) {
    console.log(error);
  } finally {
    await dbInteractions.put("spotify-playing_channelId", newMessage.channelId);
    await dbInteractions.put("spotify-playing_messageId", newMessage.id);
  }
}

module.exports = {
  data: new SlashCommandBuilder().setName("spotify-playing").setDescription("What is currently playing?"),

  async execute(client, interaction) {
    logger.info(`[Command] Spotify Playing`);
    const response = await spotify.currentlyPlaying(false);
    await interaction.reply({
      content: response,
      components: [button.actionRow(["refresh", "check"])],
    });
    const message = await interaction.fetchReply();
    disablePrevious(client, message);
    spotifyPlayingButtonInteraction(client, message);
    return "N/A";
  },
};

function spotifyPlayingButtonInteraction(client, message) {
  logger.info(`[Collector] Spotify Playing Message ID: ${message.id}`);
  const collector = new InteractionCollector(client, {
    message,
    componentType: "BUTTON",
  });
  collector.on("collect", async (press) => {
    if (press.customId == "save") {
      if (press.message.content.startsWith("https://open.spotify.com/track/")) {
        fs.writeFile("./web/saved/spotify.txt", press.message.content.replace("https://open.spotify.com/track/", "") + "\n", {flag: "a+"}, (err) => {
          if (err) {
            console.log(err);
          }
        });
      }
      await press.update({
        components: [button.actionRow(["disabled_refresh", "disabled_check"])],
      });
    } else {
      const response = await spotify.currentlyPlaying(false);
      await press.update({content: response});
    }
  });
}

module.exports.spotifyPlayingButtonInteraction = spotifyPlayingButtonInteraction;
