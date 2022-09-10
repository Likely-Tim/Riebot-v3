const {SlashCommandBuilder} = require("@discordjs/builders");
const {InteractionCollector} = require("discord.js");
const spotify = require("../helpers/spotify.js");
const button = require("../helpers/buttons.js");

// Databases
const dbSpotify = require("../databaseHelpers/spotify.js");
const dbInteractions = require("../databaseHelpers/messageInteractions.js");

async function responseParse(response, type) {
  let length = 0;
  const responseArray = [];
  if (type == "track") {
    length = response.tracks.items.length;
    if (length === 0) {
      return ["Nothing Found.", 0];
    }
    for (let i = 0; i < length; i++) {
      responseArray.push(response.tracks.items[i].external_urls.spotify);
    }
  } else if (type == "artist") {
    length = response.artists.items.length;
    if (length === 0) {
      return ["Nothing Found.", 0];
    }
    for (let i = 0; i < length; i++) {
      responseArray.push(response.artists.items[i].external_urls.spotify);
    }
  } else if (type == "album") {
    length = response.albums.items.length;
    if (length === 0) {
      return ["Nothing Found.", 0];
    }
    for (let i = 0; i < length; i++) {
      responseArray.push(response.albums.items[i].external_urls.spotify);
    }
  }
  dbSpotify.put(`${type}Index`, 0);
  dbSpotify.put(`${type}Length`, length);
  const current = responseArray[0];
  for (let i = 0; i < length; i++) {
    dbSpotify.put(`${type}${i}`, responseArray[i]);
  }
  return [current, length];
}

async function databaseRetrieve(action, type) {
  let index = await dbSpotify.get(`${type}Index`);
  const length = await dbSpotify.get(`${type}Length`);
  if (action == "next") {
    index++;
  } else if (action == "prev") {
    index--;
  }
  let content = "";
  dbSpotify.put(`${type}Index`, index);
  content = await dbSpotify.get(`${type}${index}`);
  let buttons = [];
  if (index == length - 1) {
    buttons = [button.actionRow(["prev", "disabled_next", "check"])];
  } else if (index == 0) {
    buttons = [button.actionRow(["disabled_prev", "next", "check"])];
  } else {
    buttons = [button.actionRow(["prev", "next", "check"])];
  }
  return [content, buttons];
}

async function disablePrevious(client, newMessage, type) {
  try {
    const oldChannelId = await dbInteractions.get(`spotify-${type}_channelId`);
    const oldChannel = await client.channels.fetch(oldChannelId);
    const oldMessageId = await dbInteractions.get(`spotify-${type}_messageId`);
    const oldMessage = await oldChannel.messages.fetch(oldMessageId);
    const buttons = button.disableAllButtons(oldMessage.components);
    oldMessage.edit({components: buttons});
  } catch (error) {
    console.log("[Spotify] Could not find previous message.");
  } finally {
    await dbInteractions.put(`spotify-${type}_channelId`, newMessage.channelId);
    await dbInteractions.put(`spotify-${type}_messageId`, newMessage.id);
  }
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("spotify")
    .setDescription("Search Spotify")
    .addStringOption((option) =>
      option
        .setName("type")
        .setDescription("Type to search")
        .setRequired(true)
        .addChoices([
          ["track", "track"],
          ["artist", "artist"],
          ["album", "album"],
        ])
    )
    .addStringOption((option) => option.setName("query").setDescription("What to search").setRequired(true)),

  async execute(client, interaction) {
    const type = interaction.options.getString("type");
    const query = interaction.options.getString("query");
    const response = await spotify.search(type, query);
    const result = await responseParse(response, type);
    const components = [];
    if (result[1] == 0) {
      await interaction.reply({content: result[0]});
      return `${type}_${query}`;
    } else if (result[1] == 1) {
      components.push(button.actionRow(["disabled_prev", "disabled_next", "check"]));
    } else {
      components.push(button.actionRow(["disabled_prev", "next", "check"]));
    }
    await interaction.reply({content: result[0], components});
    const message = await interaction.fetchReply();
    await disablePrevious(client, message, type);
    spotifyButtonInteraction(client, message, type);
    return `${type}_${query}`;
  },
};

function spotifyButtonInteraction(client, message, type) {
  const collector = new InteractionCollector(client, {
    message,
    componentType: "BUTTON",
  });
  collector.on("collect", async (press) => {
    if (press.customId == "save") {
      await press.update({
        components: [button.actionRow(["disabled_prev", "disabled_next", "disabled_check"])],
      });
    } else {
      const content = await databaseRetrieve(press.customId, type);
      await press.update({content: content[0], components: content[1]});
    }
  });
}

module.exports.spotifyButtonInteraction = spotifyButtonInteraction;
