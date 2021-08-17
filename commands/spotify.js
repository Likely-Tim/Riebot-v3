const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageActionRow, MessageButton } = require('discord.js');
const Database = require("@replit/database");
const db = new Database();
const SPOTID = process.env['SPOTIFY ID'];
const SPOTSECRET = process.env['SPOTIFY SECRET'];
const fetch = require("node-fetch");
const Discord = require("discord.js");

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

async function sendGetRequest_search(type, query) {
  let access_token = await db.get("spotify_access");
  let url = `https://api.spotify.com/v1/search?q=${query}&type=${type}&market=JP&limit=5`;
  let authorization = "Bearer " + access_token;
  let response = await fetch(url, {
      method: 'GET', 
      headers: {"Authorization": authorization}});
  response = await response.json();
  if(response.error !== undefined && response.error.status === 401) {
    await sendPostRequest_refreshToken();
    return await sendGetRequest_search(type, query);
  }
  return await response_parse(response, type);
}

async function response_parse(response, type) {
  await db.set("spotify_next", 0);
  for(let j = 0; j < 5; j++) {
    await db.set("spotify_" + j, "");
  }
  switch(type) {
    case("track"): {
      let current = "Nothing Found.";
      if(response.tracks.items.length === 0) {
        return current;
      }
      current = response.tracks.items[0].external_urls.spotify;
      for(let i = 0; i < response.tracks.items.length; i++) {
        db.set("spotify_" + i, response.tracks.items[i].external_urls.spotify);
      }
      return current;
    }

    case("artist"): {
      let current = "Nothing Found.";
      if(response.artists.items.length === 0) {
        return current;
      }
      current = response.artists.items[0].external_urls.spotify;
      for(let i = 0; i < response.artists.items.length; i++) {
        db.set("spotify_" + i, response.artists.items[i].external_urls.spotify);
      }
      return current;
    }

    case("album"): {
      let current = "Nothing Found.";
      if(response.albums.items.length === 0) {
        return current;
      }
      current = response.albums.items[0].external_urls.spotify;
      for(let i = 0; i < response.albums.items.length; i++) {
        db.set("spotify_" + i, response.albums.items[i].external_urls.spotify);
      }
      return current;
    }
  }
}

function query_create(args) {
  let query = args.join("+");
  return encodeURIComponent(query);
}

async function content_retrieve(action) {
  let index = await db.get("spotify_next");
  if(action == "next") {
    index += 1;
  } else if(action == "prev") {
    index -= 1;
  }
  content = await db.get("spotify_" + index);
  await db.set("spotify_next", index);
  if(index == 4) {
    buttons = [only_prev];
  } else if(index == 0) {
    buttons = [only_next];
  } else {
    buttons = [button_row];
  }
  return [content, buttons];
}

async function disable_previous(client, new_message) {
  const channel_id = await db.get("current_spotify_channel");
  const channel = await client.channels.fetch(channel_id);
  const old_message_id = await db.get("current_spotify_id");
  const old_message = await await channel.messages.fetch(old_message_id);
  old_message.edit({components: [disabled]});
  await db.set("current_spotify_channel", new_message.channelId);
  await db.set("current_spotify_id", new_message.id);
  return;
}

module.exports = {
	data: new SlashCommandBuilder()
		.setName('spotify')
		.setDescription('Search Spotify')
    .addStringOption(option => option.setName("type").setDescription("Type to search").setRequired(true).addChoices([["track", "track"], ["artist", "artist"], ["album", "album"]]))
    .addStringOption(option => option.setName("query").setDescription("What to search").setRequired(true)),

	async execute(client, interaction) {
    const type = interaction.options.getString("type");
    let query = interaction.options.getString("query");
    query = query_create(query.split(" "));
    let response = await sendGetRequest_search(type, query);
    await interaction.reply({ content: response, components: [only_next] });
    const message = await interaction.fetchReply();
    disable_previous(client, message);
    
    // Button Interaction
    let collector = new Discord.InteractionCollector(client, {message: message, componentType: "BUTTON"});
    collector.on("collect", async press => {
      let content = await content_retrieve(press.customId);
      await press.update({ content: content[0], components: content[1] });
    });
    return;
	},
};