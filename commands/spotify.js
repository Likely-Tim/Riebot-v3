const fs = require('fs');
const fetch = require("node-fetch");
const CryptoJS = require("crypto-js");
const Keyv = require('keyv');
const { KeyvFile } = require('keyv-file');
const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageActionRow, MessageButton, InteractionCollector } = require('discord.js');

// Secrets
const PASSWORD = process.env['PASSWORD'];
const SPOTID = process.env['SPOTIFY ID'];
const SPOTSECRET = process.env['SPOTIFY SECRET'];

// Databases
const db = new Keyv({
  store: new KeyvFile({
    filename: `storage/spotify.json`,
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
const check = new MessageButton()
          .setCustomId('save')
          .setStyle('SECONDARY')
          .setEmoji("✅");
const check_disabled = new MessageButton()
          .setCustomId('save')
          .setStyle('SECONDARY')
          .setEmoji("✅")
          .setDisabled(true);
const only_next = new MessageActionRow()
			.addComponents(prev_disabled, next, check);
const only_prev = new MessageActionRow()
			.addComponents(prev, next_disabled, check);
const button_row = new MessageActionRow()
			.addComponents(prev, next, check);
const disabled = new MessageActionRow()
			.addComponents(prev_disabled, next_disabled, check_disabled);


async function sendPostRequest_refreshToken() {
  let refresh_token_encrypted = tokens.get("spotify_refresh");
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

async function sendGetRequest_search(type, query) {
  let access_token_encrypted = await tokens.get("spotify_access");
  let access_token = CryptoJS.AES.decrypt(access_token_encrypted, PASSWORD).toString(CryptoJS.enc.Utf8);
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
    await disable_previous(client, message);

    // Button Interaction
    let collector = new InteractionCollector(client, {message: message, componentType: "BUTTON"});
    collector.on("collect", async press => {
      if(press.customId == "save") {
        if(press.message.content.startsWith('https://open.spotify.com/track/')) {
          fs.writeFile("./web/saved/spotify.txt", press.message.content.replace("https://open.spotify.com/track/", "") + '\n', { flag: 'a+' }, err => {
            if(err) {
              console.log(err);
              return;
            }
          });
        }
        await press.update({ components: [disabled] });
      } else {
        let content = await content_retrieve(press.customId);
        await press.update({ content: content[0], components: content[1] });
      }
    });
    return;
	},
};