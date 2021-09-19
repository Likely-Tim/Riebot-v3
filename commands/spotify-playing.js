const fs = require('fs');
const Keyv = require('keyv');
const { KeyvFile } = require('keyv-file');
const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageActionRow, MessageButton, InteractionCollector } = require('discord.js');
const spotify = require('../helpers/spotify.js');

// Databases
const messages = new Keyv({
  store: new KeyvFile({
    filename: `storage/messages.json`,
    encode: JSON.stringify,
    decode: JSON.parse
  })
});

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

async function disable_previous(client, new_message) {
  try {
    const channel_id = await messages.get("spotify-playing_channel_id");
    const channel = await client.channels.fetch(channel_id);
    const old_message_id = await messages.get("spotify-playing_message_id");
    const old_message = await channel.messages.fetch(old_message_id);
    old_message.edit({components: [disabled]});
  } catch (error) {
    console.log("[Spotify-Playing] Could not find previous message.");
  } finally {
    await messages.set("spotify-playing_channel_id", new_message.channelId);
    await messages.set("spotify-playing_message_id", new_message.id);
  }
}

module.exports = {
	data: new SlashCommandBuilder()
		.setName('spotify-playing')
		.setDescription('What is currently playing?'),

	async execute(client, interaction) {
    let response = await spotify.currentlyPlaying();
		await interaction.reply({ content: response, components: [refresh_button] });
    const message = await interaction.fetchReply();
    disable_previous(client, message);
    spotify_playing_button_interaction(client, message);
	},
};

function spotify_playing_button_interaction(client, message) {
  let collector = new InteractionCollector(client, {message: message, componentType: "BUTTON"});
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
}

module.exports.spotify_playing_button_interaction = spotify_playing_button_interaction;