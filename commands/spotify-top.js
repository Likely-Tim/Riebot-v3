const fetch = require("node-fetch");
const CryptoJS = require("crypto-js");
const Keyv = require('keyv');
const { KeyvFile } = require('keyv-file');
const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageActionRow, MessageButton, InteractionCollector } = require('discord.js');

// Secrets
const SPOTID = process.env['SPOTIFY ID'];
const SPOTSECRET = process.env['SPOTIFY SECRET'];
const PASSWORD = process.env['PASSWORD'];

// Databases
const db = new Keyv({
  store: new KeyvFile({
    filename: `storage/spotify-top.json`,
    encode: JSON.stringify,
    decode: JSON.parse
  })
});

const tokens = new Keyv({
  store: new KeyvFile({
    filename: `storage/tokens.json`,
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

async function sendPostRequest_refreshToken() {
  let refresh_token_encrypted = await tokens.get("spotify_refresh");
  let refresh_token = CryptoJS.AES.decrypt(refresh_token_encrypted, PASSWORD).toString(CryptoJS.enc.Utf8);
  let url = "https://accounts.spotify.com/api/token";
  let data = {"client_id": SPOTID, "client_secret": SPOTSECRET, "grant_type": "refresh_token", "refresh_token": refresh_token};
  let response = await fetch(url, {
      method: 'POST', 
      headers: {'Content-Type': 'application/x-www-form-urlencoded'},
      body: new URLSearchParams(data)});
  response = await response.json();
  let access_token_encrypted = CryptoJS.AES.encrypt(response.access_token, PASSWORD).toString();
  await tokens.set("spotify_access", access_token_encrypted);
  return;
}

async function sendGetRequest_top(type, time) {
  let access_token_encrypted = await tokens.get("spotify_access");
  let access_token = CryptoJS.AES.decrypt(access_token_encrypted, PASSWORD).toString(CryptoJS.enc.Utf8);
  let url = `https://api.spotify.com/v1/me/top/${type}?time_range=${time}&limit=5`;
  let authorization = "Bearer " + access_token;
  let response = await fetch(url, {
      method: 'GET', 
      headers: {"Authorization": authorization}});
  response = await response.json();
  if(response.error !== undefined && response.error.status === 401) {
    await sendPostRequest_refreshToken();
    return await sendGetRequest_top(type, time);
  }
  return response_parse(response);
}

function response_parse(input) {
  input = input.items;
  for(let i = 0; i < input.length; i++) {
    db.set("spotify_top_" + i, input[i].external_urls.spotify);
  }
  return input[0].external_urls.spotify;
}

async function disable_previous(client, new_message) {
  const channel_id = await db.get("current_spotify_channel");
  if (channel_id != undefined) {
    const channel = await client.channels.fetch(channel_id);
    const old_message_id = await db.get("current_spotify_id");
    try {
      const old_message = await channel.messages.fetch(old_message_id);
      old_message.edit({components: [disabled]});
    } catch (error) {
      console.log("Previous spotify response was deleted.");
    }
  }
  await db.set("current_spotify_channel", new_message.channelId);
  await db.set("current_spotify_id", new_message.id);
  return;
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
    let response = await sendGetRequest_top(type, time);
		await interaction.reply({ content: response, components: [only_next] });

    const message = await interaction.fetchReply();
    await disable_previous(client, message);
    await db.set("counter", 0);
    let collector = new InteractionCollector(client, {message: message, componentType: "BUTTON"});
    collector.on("collect", async press => {
      if(press.customId == "next") {
        let counter = await db.get("counter");
        counter++;
        let result = await db.get("spotify_top_" + counter);
        db.set("counter", counter);
        if(counter == 4) {
          await press.update({content: result, components: [only_prev]})
        } else {
          await press.update({content: result, components: [button_row]});
        }
      } else if(press.customId == "prev") {
        let counter = await db.get("counter");
        counter--;
        let result = await db.get("spotify_top_" + counter);
        db.set("counter", counter);
        if(counter == 0) {
          await press.update({content: result, components: [only_next]})
        } else {
          await press.update({content: result, components: [button_row]});
        }
      }
    });
    return;
	},
};