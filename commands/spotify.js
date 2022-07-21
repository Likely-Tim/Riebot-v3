const { SlashCommandBuilder } = require('@discordjs/builders');
const { InteractionCollector } = require('discord.js');
const spotify = require('../helpers/spotify.js');
const button = require('../helpers/buttons.js');

// Databases
const postgress = require('pg');
const database = new postgress.Client({connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false }});
database.connect();

async function response_parse(response, type) {
  let length = 0;
  let response_array = [];
  if (type == "track") {
    length = response.tracks.items.length;
    if(length === 0) {
      return ["Nothing Found.", 0];
    }
    for(let i = 0; i < length; i++) {
      response_array.push(response.tracks.items[i].external_urls.spotify);
    }
  } else if (type == "artist") {
    length = response.artists.items.length;
    if(length === 0) {
      return ["Nothing Found.", 0];
    }
    for(let i = 0; i < length; i++) {
      response_array.push(response.artists.items[i].external_urls.spotify);
    }
  } else if (type == "album") {
    length = response.albums.items.length;
    if(length === 0) {
      return ["Nothing Found.", 0];
    }
    for(let i = 0; i < length; i++) {
      response_array.push(response.albums.items[i].external_urls.spotify);
    }
  }
  database.query(`INSERT INTO database_index VALUES ('spotify_${type}', 0, ${length}) ON CONFLICT (name) DO UPDATE SET index = EXCLUDED.index, length = EXCLUDED.length;`);
  let current = response_array[0];
  for (let i = 0; i < length; i++) {
    database.query(`INSERT INTO spotify_${type} VALUES (${i}, '${response_array[i]}') ON CONFLICT (index) DO UPDATE SET data = EXCLUDED.data;`)
  }
  return [current, length];
}

async function database_retrieve(action, type) {
  let res = await database.query(`SELECT * FROM database_index WHERE name = 'spotify_${type}';`);
  let index = res.rows[0].index;
  let length = res.rows[0].length;
  if(action == "next") {
    index++;
  } else if(action == "prev") {
    index--;
  }
  let content = "";
  database.query(`UPDATE database_index SET index = ${index} WHERE name = 'spotify_${type}';`);
  res = await database.query(`SELECT * FROM spotify_${type} WHERE index = ${index};`);
  content = res.rows[0].data;
  let buttons = [];
  if(index == length - 1) {
    buttons = [button.action_row(["prev", "disabled_next", "check"])];
  } else if(index == 0) {
    buttons = [button.action_row(["disabled_prev", "next", "check"])];
  } else {
    buttons = [button.action_row(["prev", "next", "check"])];
  }
  return [content, buttons];
}

async function disable_previous_message(client, new_message, type) {
  try {
    const res = await database.query(`SELECT * FROM message_history WHERE name = 'spotify_${type}';`);
    const channel_id = res.rows[0].channel_id;
    const previous_message_id = res.rows[0].message_id;
    const channel = await client.channels.fetch(channel_id);
    const previous_message = await channel.messages.fetch(previous_message_id);
    let buttons = button.disable_all_buttons(previous_message.components);
    previous_message.edit({components: buttons});
  } catch (error) {
    console.log("[Spotify] Could not find previous message.");
  } finally {
    await database.query(`INSERT INTO message_history VALUES ('spotify_${type}', ${new_message.channelId}, ${new_message.id}) ON CONFLICT (name) DO UPDATE SET channel_id = EXCLUDED.channel_id, message_id = EXCLUDED.message_id;`);
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
    let response = await spotify.search(type, query);
    let result = await response_parse(response, type);
    let components = []
    if (result[1] == 0) {
      await interaction.reply({ content: result[0] });
      return `${type}_${query}`;
    } else if (result[1] == 1) {
      components.push(button.action_row(["disabled_prev", "disabled_next", "check"]));
    } else {
      components.push(button.action_row(["disabled_prev", "next", "check"]));
    }
    await interaction.reply({ content: result[0], components: components });
    const message = await interaction.fetchReply();
    await disable_previous_message(client, message, type);
    spotify_button_interaction(client, message, type);
    return `${type}_${query}`;
	},
};

function spotify_button_interaction(client, message, type) {
  let collector = new InteractionCollector(client, {message: message, componentType: "BUTTON"});
  collector.on("collect", async press => {
    if(press.customId == "save") {
      await press.update({ components: [button.action_row(["disabled_prev", "disabled_next", "disabled_check"])] });
    } else {
      let content = await database_retrieve(press.customId, type);
      await press.update({ content: content[0], components: content[1] });
    }
  });
}

module.exports.spotify_button_interaction = spotify_button_interaction;