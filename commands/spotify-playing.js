const fs = require("fs");
const {SlashCommandBuilder} = require("@discordjs/builders");
const {InteractionCollector} = require("discord.js");
const spotify = require("../helpers/spotify.js");
const button = require("../helpers/buttons.js");

// Databases
const dbInteractions = require("../databaseHelpers/messageInteractions.js");

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
