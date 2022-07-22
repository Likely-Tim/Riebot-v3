const {SlashCommandBuilder} = require('@discordjs/builders');
const {InteractionCollector} = require('discord.js');
const spotify = require('../helpers/spotify.js');
const button = require('../helpers/buttons.js');

// Databases
const postgress = require('pg');
const database = new postgress.Client({connectionString: process.env.DATABASE_URL, ssl: {rejectUnauthorized: false}});
database.connect();

async function responseParse(response, type) {
  let length = 0;
  const responseArray = [];
  if (type == 'Track') {
    length = response.tracks.items.length;
    if (length === 0) {
      return ['Nothing Found.', 0];
    }
    for (let i = 0; i < length; i++) {
      responseArray.push(response.tracks.items[i].external_urls.spotify);
    }
  } else if (type == 'Artist') {
    length = response.artists.items.length;
    if (length === 0) {
      return ['Nothing Found.', 0];
    }
    for (let i = 0; i < length; i++) {
      responseArray.push(response.artists.items[i].external_urls.spotify);
    }
  } else if (type == 'Album') {
    length = response.albums.items.length;
    if (length === 0) {
      return ['Nothing Found.', 0];
    }
    for (let i = 0; i < length; i++) {
      responseArray.push(response.albums.items[i].external_urls.spotify);
    }
  }
  database.query(`INSERT INTO databaseIndex VALUES ('spotify${type}', 0, ${length}) ON CONFLICT (name) DO UPDATE SET index = EXCLUDED.index, length = EXCLUDED.length;`);
  const current = responseArray[0];
  for (let i = 0; i < length; i++) {
    database.query(`INSERT INTO spotify${type} VALUES (${i}, '${responseArray[i]}') ON CONFLICT (index) DO UPDATE SET data = EXCLUDED.data;`);
  }
  return [current, length];
}

async function databaseRetrieve(action, type) {
  let res = await database.query(`SELECT * FROM databaseIndex WHERE name = 'spotify${type}';`);
  let index = res.rows[0].index;
  const length = res.rows[0].length;
  if (action == 'next') {
    index++;
  } else if (action == 'prev') {
    index--;
  }
  let content = '';
  database.query(`UPDATE databaseIndex SET index = ${index} WHERE name = 'spotify${type}';`);
  res = await database.query(`SELECT * FROM spotify${type} WHERE index = ${index};`);
  content = res.rows[0].data;
  let buttons = [];
  if (index == length - 1) {
    buttons = [button.actionRow(['prev', 'disabled_next', 'check'])];
  } else if (index == 0) {
    buttons = [button.actionRow(['disabled_prev', 'next', 'check'])];
  } else {
    buttons = [button.actionRow(['prev', 'next', 'check'])];
  }
  return [content, buttons];
}

async function disablePreviousMessage(client, newMessage, type) {
  try {
    const res = await database.query(`SELECT * FROM messageIndex WHERE name = 'spotify${type}';`);
    const channelId = res.rows[0].channelId;
    const previousMessageId = res.rows[0].message_id;
    const channel = await client.channels.fetch(channelId);
    const previousMessage = await channel.messages.fetch(previousMessageId);
    const buttons = button.disableAllButtons(previousMessage.components);
    previousMessage.edit({components: buttons});
  } catch (error) {
    console.log('[Spotify] Could not find previous message.');
  } finally {
    await database.query(`INSERT INTO messageIndex VALUES ('spotify${type}', ${newMessage.channelId}, ${newMessage.id}) ON CONFLICT (name) DO UPDATE SET channelId = EXCLUDED.channelId, message_id = EXCLUDED.message_id;`);
  }
}

module.exports = {
  data: new SlashCommandBuilder()
      .setName('spotify')
      .setDescription('Search Spotify')
      .addStringOption((option) => option.setName('type').setDescription('Type to search').setRequired(true).addChoices([['track', 'Track'], ['artist', 'Artist'], ['album', 'Album']]))
      .addStringOption((option) => option.setName('query').setDescription('What to search').setRequired(true)),

  async execute(client, interaction) {
    const type = interaction.options.getString('type');
    const query = interaction.options.getString('query');
    const response = await spotify.search(type, query);
    const result = await responseParse(response, type);
    const components = [];
    if (result[1] == 0) {
      await interaction.reply({content: result[0]});
      return `${type}_${query}`;
    } else if (result[1] == 1) {
      components.push(button.actionRow(['disabled_prev', 'disabled_next', 'check']));
    } else {
      components.push(button.actionRow(['disabled_prev', 'next', 'check']));
    }
    await interaction.reply({content: result[0], components});
    const message = await interaction.fetchReply();
    await disablePreviousMessage(client, message, type);
    spotifyButtonInteraction(client, message, type);
    return `${type}_${query}`;
  },
};

function spotifyButtonInteraction(client, message, type) {
  const collector = new InteractionCollector(client, {message, componentType: 'BUTTON'});
  collector.on('collect', async (press) => {
    if (press.customId == 'save') {
      await press.update({components: [button.actionRow(['disabled_prev', 'disabled_next', 'disabled_check'])]});
    } else {
      const content = await databaseRetrieve(press.customId, type);
      await press.update({content: content[0], components: content[1]});
    }
  });
}

module.exports.spotifyButtonInteraction = spotifyButtonInteraction;
