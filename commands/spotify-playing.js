const fs = require('fs');
const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageActionRow, MessageButton } = require('discord.js');
const Database = require("@replit/database");
const SPOTID = process.env['SPOTIFY ID'];
const SPOTSECRET = process.env['SPOTIFY SECRET'];
const fetch = require("node-fetch");
const db = new Database();
const Discord = require("discord.js");


const refresh = new MessageButton()
					.setCustomId('refresh')
					.setStyle('SECONDARY')
          .setEmoji("🔄");
const refresh_disabled = new MessageButton()
					.setCustomId('refresh')
					.setStyle('SECONDARY')
          .setEmoji("🔄")
          .setDisabled(true);
const check = new MessageButton()
          .setCustomId('save')
          .setStyle('SECONDARY')
          .setEmoji("✅");
const check_disabled = new MessageButton()
          .setCustomId('save')
          .setStyle('SECONDARY')
          .setEmoji("✅")
          .setDisabled(true);
const refresh_button = new MessageActionRow()
			.addComponents(refresh, check);
const refresh_button_disabled = new MessageActionRow()
			.addComponents(refresh_disabled, check_disabled);

async function sendPostRequest_refreshToken() {
  let refresh = await db.get("spotify_refresh");
  let url = "https://accounts.spotify.com/api/token";
  let data = {"client_id": SPOTID, "client_secret": SPOTSECRET, "grant_type": "refresh_token", "refresh_token": refresh};
  let response = await fetch(url, {
      method: 'POST', 
      headers: {'Content-Type': 'application/x-www-form-urlencoded'},
      body: new URLSearchParams(data)});
  response = await response.json();
  db.set("spotify_access", response.access_token);
  return;
}

async function sendGetRequest_currentPlaying() {
  let access_token = await db.get("spotify_access");
  let url = `https://api.spotify.com/v1/me/player/currently-playing?market=US`;
  let authorization = "Bearer " + access_token;
  let response = await fetch(url, {
      method: 'GET', 
      headers: {"Authorization": authorization}});
  return await playing_parse(response);
}

async function playing_parse(response) {
  if(response.status === 401) {
    await sendPostRequest_refreshToken();
    let response = await sendGetRequest_currentPlaying();
    return response;
  }
  if(response.status === 204) {
    return "Nothing playing.";
  }
  response = await response.json();
  return response.item.external_urls.spotify
}

async function disable_previous(client, new_message) {
  const channel_id = await db.get("current_spotify_playing_channel");
  const channel = await client.channels.fetch(channel_id);
  const old_message_id = await db.get("current_spotify_playing_id");
  const old_message = await await channel.messages.fetch(old_message_id);
  old_message.edit({components: [refresh_button_disabled]});
  await db.set("current_spotify_playing_channel", new_message.channelId);
  await db.set("current_spotify_playing_id", new_message.id);
  return;
}

module.exports = {
	data: new SlashCommandBuilder()
		.setName('spotify-playing')
		.setDescription('What is currently playing?'),

	async execute(client, interaction) {
    let response = await sendGetRequest_currentPlaying();
		await interaction.reply({ content: response, components: [refresh_button] });
    const message = await interaction.fetchReply();
    disable_previous(client, message);

    // Button Interaction
    let collector = new Discord.InteractionCollector(client, {message: message, componentType: "BUTTON"});
    collector.on("collect", async press => {
      if(press.customId == 'save') {
        if(press.message.content.startsWith('https://open.spotify.com/track/')) {
          fs.writeFile("./web/saved/spotify.txt", press.message.content.replace("https://open.spotify.com/track/", "") + '\n', { flag: 'a+' }, err => {
            if(err) {
              console.log(err);
              return;
            }
          });
        }
        await press.update({ components: [refresh_button_disabled] })
      } else {
        let response = await sendGetRequest_currentPlaying();
        await press.update({ content: response, components: [refresh_button] });
      }
    });
	},
};