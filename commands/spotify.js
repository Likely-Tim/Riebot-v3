const fs = require('fs');
const fetch = require("node-fetch");
const CryptoJS = require("crypto-js");
const Keyv = require('keyv');
const { KeyvFile } = require('keyv-file');
const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageActionRow, MessageButton, InteractionCollector } = require('discord.js');
const mapJson = require('../helpers/map-json.js');
const spotify = require('../helpers/spotify.js');

// Secrets
const PASSWORD = process.env['PASSWORD'];
const SPOTID = process.env['SPOTIFY ID'];
const SPOTSECRET = process.env['SPOTIFY SECRET'];

let cache = initialize_cache();

function initialize_cache() {
  const json_string = fs.readFileSync('storage/spotify-cache.json').toString();
  const map = JSON.parse(json_string, mapJson.reviver);
  return map;
}

// Databases
const db = new Keyv({
  store: new KeyvFile({
    filename: `storage/spotify.json`,
    encode: JSON.stringify,
    decode: JSON.parse
  })
});

let tokens = new Keyv({
  store: new KeyvFile({
    filename: `storage/tokens.json`,
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

const storage = new Keyv({
  store: new KeyvFile({
    filename: `storage/spotify-storage.json`,
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

async function response_parse(response, type) {
  let id = String(cache.size - 1);
  let store = {};
  let url_array = [];
  await db.set("spotify_next", 0);
  for(let j = 0; j < 5; j++) {
    await db.set("spotify_" + j, "");
  }
  switch(type) {
    case("track"): {
      let current = "Nothing Found.";
      if(response.tracks.items.length === 0) {
        store.found = false;
        storage.set(id, store);
        return current;
      }
      current = response.tracks.items[0].external_urls.spotify;
      for(let i = 0; i < response.tracks.items.length; i++) {
        db.set("spotify_" + i, response.tracks.items[i].external_urls.spotify);
        url_array.push(response.tracks.items[i].external_urls.spotify);
      }
      store.found = true;
      store.links = url_array;
      storage.set(id, store);
      return current;
    }

    case("artist"): {
      let current = "Nothing Found.";
      if(response.artists.items.length === 0) {
        store.found = false;
        storage.set(id, store);
        return current;
      }
      current = response.artists.items[0].external_urls.spotify;
      for(let i = 0; i < response.artists.items.length; i++) {
        db.set("spotify_" + i, response.artists.items[i].external_urls.spotify);
        url_array.push(response.artists.items[i].external_urls.spotify);
      }
      store.found = true;
      store.links = url_array;
      storage.set(id, store);
      return current;
    }

    case("album"): {
      let current = "Nothing Found.";
      if(response.albums.items.length === 0) {
        store.found = false;
        storage.set(id, store);
        return current;
      }
      current = response.albums.items[0].external_urls.spotify;
      for(let i = 0; i < response.albums.items.length; i++) {
        db.set("spotify_" + i, response.albums.items[i].external_urls.spotify);
        url_array.push(response.albums.items[i].external_urls.spotify);
      }
      store.found = true;
      store.links = url_array;
      storage.set(id, store);
      return current;
    }
  }
}

async function storage_to_main(id) {
  let result = await storage.get(id);
  let current = "Nothing Found.";
  if(result.found) {
    await db.set("spotify_next", 0);
    let links = result.links;
    current = links[0];
    for(let i = 0; i < links.length; i++) {
      db.set("spotify_" + i, links[i])
    }
  } 
  return current;
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
  try {
    const channel_id = await messages.get("spotify_channel_id");
    const channel = await client.channels.fetch(channel_id);
    const old_message_id = await messages.get("spotify_message_id");
    const old_message = await channel.messages.fetch(old_message_id);
    old_message.edit({components: [disabled]});
  } catch (error) {
    console.log("[Spotify] Could not find previous message.");
  } finally {
    await messages.set("spotify_channel_id", new_message.channelId);
    await messages.set("spotify_message_id", new_message.id);
  }
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
    if(!cache_find(type, query)) {
      query = query_create(query.split(" "));
      let response = await spotify.search(type, query);
      let result = await response_parse(response, type);
      await interaction.reply({ content: result, components: [only_next] });
      const message = await interaction.fetchReply();
      await disable_previous(client, message);
      spotify_button_interaction(client, message);
    } else {
      let result = await storage_to_main(cache.get(`${type}_${query}`));
      await interaction.reply({ content: result, components: [only_next] });
      const message = await interaction.fetchReply();
      await disable_previous(client, message);
      spotify_button_interaction(client, message);
    }
    return;
	},
};

function cache_find(type, query) {
  if(!cache.has(`${type}_${query}`)) {
    cache.set(`${type}_${query}`, String(cache.size));
    let str = JSON.stringify(cache, mapJson.replacer);
    fs.writeFile('storage/spotify-cache.json', str, (err) => {
      if(err) {
        console.log(err);
      }
    });
    console.log(`[Spotify] Cache miss.`);
    return false;
  } else {
    console.log(`[Spotify] Cache hit.`);
    return true;
  }
}

function spotify_button_interaction(client, message) {
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
}

module.exports.spotify_button_interaction = spotify_button_interaction;