const fs = require('fs');
const Keyv = require('keyv');
const {KeyvFile} = require('keyv-file');
const {SlashCommandBuilder} = require('@discordjs/builders');
const {InteractionCollector} = require('discord.js');
const spotify = require('../helpers/spotify.js');
const button = require('../helpers/buttons.js');

// Databases
const messages = new Keyv({
  store: new KeyvFile({
    filename: 'storage/messages.json',
    encode: JSON.stringify,
    decode: JSON.parse,
  }),
});

async function disablePrevious(client, newMessage) {
  try {
    const channelId = await messages.get('spotify-playing_channelId');
    const channel = await client.channels.fetch(channelId);
    const oldMessageId = await messages.get('spotify-playing_message_id');
    const oldMessage = await channel.messages.fetch(oldMessageId);
    const buttons = button.disableAllButtons(oldMessage.components);
    oldMessage.edit({components: buttons});
  } catch (error) {
    console.log('[Spotify-Playing] Could not find previous message.');
  } finally {
    await messages.set('spotify-playing_channelId', newMessage.channelId);
    await messages.set('spotify-playing_message_id', newMessage.id);
  }
}

module.exports = {
  data: new SlashCommandBuilder()
      .setName('spotify-playing')
      .setDescription('What is currently playing?'),

  async execute(client, interaction) {
    const response = await spotify.currentlyPlaying(false);
    await interaction.reply({content: response, components: [button.actionRow(['refresh', 'check'])]});
    const message = await interaction.fetchReply();
    disablePrevious(client, message);
    spotifyPlayingButtonInteraction(client, message);
    return 'N/A';
  },
};

function spotifyPlayingButtonInteraction(client, message) {
  const collector = new InteractionCollector(client, {message, componentType: 'BUTTON'});
  collector.on('collect', async (press) => {
    if (press.customId == 'save') {
      if (press.message.content.startsWith('https://open.spotify.com/track/')) {
        fs.writeFile('./web/saved/spotify.txt', press.message.content.replace('https://open.spotify.com/track/', '') + '\n', {flag: 'a+'}, (err) => {
          if (err) {
            console.log(err);
          }
        });
      }
      await press.update({components: [button.actionRow(['disabled_refresh', 'disabled_check'])]});
    } else {
      const response = await spotify.currentlyPlaying(false);
      await press.update({content: response});
    }
  });
}

module.exports.spotifyPlayingButtonInteraction = spotifyPlayingButtonInteraction;
