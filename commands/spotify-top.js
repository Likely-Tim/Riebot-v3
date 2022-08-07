const Keyv = require("keyv");
const { KeyvFile } = require("keyv-file");
const { SlashCommandBuilder } = require("@discordjs/builders");
const { InteractionCollector } = require("discord.js");
const spotify = require("../helpers/spotify.js");
const button = require("../helpers/buttons.js");

// Databases
const db = new Keyv({
  store: new KeyvFile({
    filename: "storage/spotify-top.json",
    encode: JSON.stringify,
    decode: JSON.parse,
  }),
});

const messages = new Keyv({
  store: new KeyvFile({
    filename: "storage/messages.json",
    encode: JSON.stringify,
    decode: JSON.parse,
  }),
});

function responseParse(input) {
  input = input.items;
  const length = input.length;
  db.set("spotify-top_length", length);
  db.set("spotify-top_index", 0);
  for (let i = 0; i < length; i++) {
    db.set("spotify-top_" + i, input[i].external_urls.spotify);
  }
  return [input[0].external_urls.spotify, length];
}

async function contentRetrieve(action) {
  const length = await db.get("spotify-top_length");
  let index = await db.get("spotify-top_index");
  if (action == "next") {
    index += 1;
  } else if (action == "prev") {
    index -= 1;
  }
  db.set("spotify-top_index", index);
  const content = await db.get("spotify-top_" + index);
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
    const channelId = await messages.get("spotify-top_channelId");
    const channel = await client.channels.fetch(channelId);
    const oldMessageId = await messages.get("spotify-top_message_id");
    const oldMessage = await channel.messages.fetch(oldMessageId);
    const buttons = button.disableAllButtons(oldMessage.components);
    oldMessage.edit({ components: buttons });
  } catch (error) {
    console.log("[Spotify-Top] Could not find previous message.");
  } finally {
    await messages.set("spotify-top_channelId", newMessage.channelId);
    await messages.set("spotify-top_message_id", newMessage.id);
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
        .setDescription(
          "Time Length (Short Term: 1 month, Medium Term: 6 month, Long Term: From Beginning)"
        )
        .setRequired(true)
        .addChoices([
          ["short_term", "short_term"],
          ["medium_term", "medium_term"],
          ["long_term", "long_term"],
        ])
    ),

  async execute(client, interaction) {
    const type = interaction.options.getString("type");
    const time = interaction.options.getString("time");
    const response = await spotify.topPlayed(type, time);
    const result = responseParse(response);
    let components = [button.actionRow(["disabled_prev", "next"])];
    if (result[1] == 1) {
      components = [button.actionRow(["disabled_prev", "disabled_next"])];
    }
    await interaction.reply({ content: result[0], components });

    const message = await interaction.fetchReply();
    await disablePrevious(client, message);
    spotifyTopButtonInteraction(client, message);
    return `${type}_${time}`;
  },
};

function spotifyTopButtonInteraction(client, message) {
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
