const { SlashCommandBuilder } = require('@discordjs/builders');
const spotify = require('../helpers/spotify.js');
const sleep = require('util').promisify(setTimeout);

module.exports = {
	data: new SlashCommandBuilder()
		.setName('playlist-add')
		.setDescription('Add to the playlist'),
	async execute(client, interaction) {
    if(interaction.user.id != 332923810099494913) {
      await interaction.reply(":)");
      return;
    }
    console.log("In command");
    let response = await spotify.playlist_add_playing();
    if(response) {
      await interaction.reply("Added");
    } else {
      await interaction.reply("Can't add");
    }
    await sleep(3000);
    await interaction.deleteReply();
	},
};