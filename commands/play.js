const { SlashCommandBuilder } = require('@discordjs/builders');
const voice = require('../helpers/voice.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('play')
		.setDescription('Voice Channel Commands')
    .addStringOption(option => option.setName('task').setDescription('command').setRequired(true).addChoices([["Song Link", "song_link"], ["Playlist Link", "playlist_link"], ["Current Song", "current"], ["Skip Song", "skip"]]))
    .addStringOption(option => option.setName("query").setDescription("What to search")),
	async execute(client, interaction) {
    await interaction.deferReply();
    if(!interaction.member.voice.channelId) {
      interaction.editReply("Not in a voice channel.");
      return;
    }
    let queue = voice.create_queue(client.player, interaction.guildId);
    await voice.join_channel(interaction.member.voice.channelId);
    const task = interaction.options.getString("task");
    const query = interaction.options.getString("query");
    
    switch(task) {
        case("song_link"): {
          let success = await voice.link_play(query);
          if(success) {
            interaction.editReply({embeds: [voice.get_song_queue()]});
            return;
          } else {
            interaction.editReply(`Can't play ${query}.`);
            return;
          }
        }

        case("playlist_link"): {
          let success = await voice.link_playlist(query);
          if(success) {
            interaction.editReply({embeds: [voice.get_song_queue()]});
            return;
          } else {
            interaction.editReply(`Can't play ${query}.`);
            return;
          }
        }

        case("current"): {
          interaction.editReply({embeds: [voice.get_current_song()]});
          return;
        }

        case("skip"): {
          interaction.editReply({embeds: [voice.skip_song()]});
          return
        }
    }
		interaction.editReply("OOP");
    return "N/A";
	},
};