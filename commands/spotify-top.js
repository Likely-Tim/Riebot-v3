const fetch = require("node-fetch");
const CryptoJS = require("crypto-js");
const Keyv = require('keyv');
const { KeyvFile } = require('keyv-file');
const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageActionRow, MessageButton, InteractionCollector } = require('discord.js');
const spotify = require('../helpers/spotify.js');
const button = require('../helpers/buttons.js');

// Databases
const db = new Keyv({
  store: new KeyvFile({
    filename: `storage/spotify-top.json`,
    encode: JSON.stringify,
    decode: JSON.parse
  })
});

const messages = new Keyv({
  store: new KeyvFile({
    filename: `storage/messages.json`,
    encode: JSON.stringify,
    decode: JSON.parse
  })
});

// Buttons
const next = new MessageButton()
					.setCustomId('next')
					.setStyle('SECONDARY')
          .setEmoji("➡️");
const prev = new MessageButton()
					.setCustomId('prev')
					.setStyle('SECONDARY')
          .setEmoji("⬅️");
const next_disabled = new MessageButton()
          .setCustomId('next')
					.setStyle('SECONDARY')
          .setEmoji("➡️")
          .setDisabled(true);
const prev_disabled = new MessageButton()
          .setCustomId('prev')
					.setStyle('SECONDARY')
          .setEmoji("⬅️")
          .setDisabled(true);
const only_next = new MessageActionRow()
			.addComponents(prev_disabled, next);
const only_prev = new MessageActionRow()
			.addComponents(prev, next_disabled);
const button_row = new MessageActionRow()
			.addComponents(prev, next);
const disabled = new MessageActionRow()
			.addComponents(prev_disabled, next_disabled);

function response_parse(input) {
  input = input.items;
  db.set("spotify-top_length", input.length);
  db.set("spotify-top_index", 0);
  for(let i = 0; i < input.length; i++) {
    db.set("spotify-top_" + i, input[i].external_urls.spotify);
  }
  return input[0].external_urls.spotify;
}

async function content_retrieve(action) {
  let length = await db.get("spotify-top_length");
  let index = await db.get("spotify-top_index");
  if(action == "next") {
    index += 1;
  } else if(action == "prev") {
    index -= 1;
  }
  db.set("spotify-top_index", index);
  let content = await db.get("spotify-top_" + index);
  let buttons = [];
  if(index == length - 1) {
    buttons = [button.add_buttons(["prev", "disabled_next"])];
  } else if(index == 0) {
    buttons = [button.add_buttons(["disabled_prev", "next"])];
  } else {
    buttons = [button.add_buttons(["prev", "next"])];
  }
  return [content, buttons];
  
}

async function disable_previous(client, new_message) {
  try {
    const channel_id = await messages.get("spotify-top_channel_id");
    const channel = await client.channels.fetch(channel_id);
    const old_message_id = await messages.get("spotify-top_message_id");
    const old_message = await channel.messages.fetch(old_message_id);
    old_message.edit({components: [disabled]});
  } catch (error) {
    console.log("[Spotify-Top] Could not find previous message.");
  } finally {
    await messages.set("spotify-top_channel_id", new_message.channelId);
    await messages.set("spotify-top_message_id", new_message.id);
  }
}

module.exports = {
	data: new SlashCommandBuilder()
		.setName('spotify-top')
		.setDescription('Top Played')
    .addStringOption(option => option.setName("type").setDescription("Type to search").setRequired(true).addChoices([["track", "tracks"], ["artist", "artists"]]))
    .addStringOption(option => option.setName("time").setDescription("Time Length (Short Term: 1 month, Medium Term: 6 month, Long Term: From Beginning)").setRequired(true).addChoices([["short_term", "short_term"], ["medium_term", "medium_term"], ["long_term", "long_term"]])),

	async execute(client, interaction) {
    const type = interaction.options.getString("type");
    const time = interaction.options.getString("time");
    let response = await spotify.topPlayed(type, time);
    let result = response_parse(response);  
		await interaction.reply({ content: result, components: [only_next] });

    const message = await interaction.fetchReply();
    await disable_previous(client, message);
    await db.set("counter", 0);
    spotify_top_button_interaction(client, message);
    return;
	},
};

function spotify_top_button_interaction(client, message) {
  let collector = new InteractionCollector(client, {message: message, componentType: "BUTTON"});
  collector.on("collect", async press => {
    let result = await content_retrieve(press.customId);
    press.update({ content: result[0], components: result[1]});
  });
}

module.exports.spotify_top_button_interaction = spotify_top_button_interaction;