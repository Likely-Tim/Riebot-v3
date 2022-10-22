const { SlashCommandBuilder } = require("@discordjs/builders");
const { InteractionCollector } = require("discord.js");
const spotify = require("../utils/spotify.js");
const button = require("../utils/buttons.js");

const BASE_URL = process.env.BASE_URL;

// Databases
const dbInteractions = require("../databaseUtils/messageInteractions.js");
const dbSpotify = require("../databaseUtils/spotify-top.js");
const dbToken = require("../databaseUtils/tokens");

const { logger } = require("../utils/logger.js");

function responseParse(input) {
  input = input.items;
  const length = input.length;
  dbSpotify.put("spotify-top_length", length);
  dbSpotify.put("spotify-top_index", 0);
  for (let i = 0; i < length; i++) {
    dbSpotify.put(`spotify-top_${i}`, input[i].external_urls.spotify);
  }
  return [input[0].external_urls.spotify, length];
}

async function contentRetrieve(action) {
  const length = await dbSpotify.get("spotify-top_length");
  let index = await dbSpotify.get("spotify-top_index");
  if (action == "next") {
    index++;
  } else if (action == "prev") {
    index--;
  }
  dbSpotify.put("spotify-top_index", index);
  const content = await dbSpotify.get(`spotify-top_${index}`);
  let buttons = [];
  if (index == length - 1) {
    buttons = [button.actionRow(["prev", "disabled_next"])];
  } else if (index == 0) {
    buttons = [button.actionRow(["disabled_prev", "next"])];
  } else {
    buttons = [button.actionRow(["prev", "next"])];
  }
  return [content, buttons];
}

async function disablePrevious(client, newMessage) {
  try {
    const oldChannelId = await dbInteractions.get("spotify-top_channelId");
    const oldChannel = await client.channels.fetch(oldChannelId);
    const oldMessageId = await dbInteractions.get("spotify-top_messageId");
    const oldMessage = await oldChannel.messages.fetch(oldMessageId);
    const buttons = button.disableAllButtons(oldMessage.components);
    oldMessage.edit({ components: buttons });
  } catch (error) {
    console.log(error);
  } finally {
    await dbInteractions.put("spotify-top_channelId", newMessage.channelId);
    await dbInteractions.put("spotify-top_messageId", newMessage.id);
  }
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("spotify-top")
    .setDescription("Top Played")
    .addStringOption((option) =>
      option
        .setName("type")
        .setDescription("Type to search")
        .setRequired(true)
        .addChoices([
          ["track", "tracks"],
          ["artist", "artists"],
        ])
    )
    .addStringOption((option) =>
      option
        .setName("time")
        .setDescription("Time Length (Short Term: 1 month, Medium Term: 6 month, Long Term: From Beginning)")
        .setRequired(true)
        .addChoices([
          ["short term", "short_term"],
          ["medium term", "medium_term"],
          ["long term", "long_term"],
        ])
    ),

  async execute(client, interaction) {
    const type = interaction.options.getString("type");
    const time = interaction.options.getString("time");
    const userId = interaction.user.id;
    logger.info(`[Command] Spotify Top | Type: ${type} | Time: ${time} | User: ${userId}`);
    const accessToken = await dbToken.get(`${userId}SpotifyAccess`);
    if (!accessToken) {
      interaction.reply({ content: `${BASE_URL}auth/discord?task=spotify`, ephemeral: true });
      return;
    }
    const response = await spotify.topPlayed(userId, type, time);
    const [spotifyUrl, length] = responseParse(response);
    let components = [button.actionRow(["disabled_prev", "next"])];
    if (length == 1) {
      components = [button.actionRow(["disabled_prev", "disabled_next"])];
    }
    await interaction.reply({ content: spotifyUrl, components });

    const message = await interaction.fetchReply();
    await disablePrevious(client, message);
    spotifyTopButtonInteraction(client, message);
    return `${type}_${time}`;
  },
};

function spotifyTopButtonInteraction(client, message) {
  logger.info(`[Collector] Spotify Top Message ID: ${message.id}`);
  const collector = new InteractionCollector(client, {
    message,
    componentType: "BUTTON",
  });
  collector.on("collect", async (press) => {
    const result = await contentRetrieve(press.customId);
    press.update({ content: result[0], components: result[1] });
  });
}

module.exports.spotifyTopButtonInteraction = spotifyTopButtonInteraction;
