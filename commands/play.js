const {SlashCommandBuilder} = require('@discordjs/builders');
const voice = require('../helpers/voice.js');

module.exports = {
  data: new SlashCommandBuilder()
      .setName('play')
      .setDescription('Voice Channel Commands')
      .addStringOption((option) => option.setName('task').setDescription('command').setRequired(true).addChoices([['Song Link', 'song_link'], ['Playlist Link', 'playlist_link'], ['Current Song', 'current'], ['Skip Song', 'skip'], ['Shuffle', 'shuffle']]))
      .addStringOption((option) => option.setName('query').setDescription('What to search')),
  async execute(client, interaction) {
    await interaction.deferReply();
    if (!interaction.member.voice.channelId) {
      interaction.editReply('Not in a voice channel.');
      return;
    }
    voice.createQueue(client.player, interaction.guildId);
    await voice.joinChannel(interaction.member.voice.channelId);
    const task = interaction.options.getString('task');
    const query = interaction.options.getString('query');

    switch (task) {
      case ('song_link'): {
        const success = await voice.linkPlay(query);
        if (success) {
          interaction.editReply({embeds: [voice.getSongQueue()]});
          return;
        } else {
          interaction.editReply(`Can't play ${query}.`);
          return;
        }
      }

      case ('playlist_link'): {
        const success = await voice.linkPlaylist(query);
        if (success) {
          interaction.editReply({embeds: [voice.getSongQueue()]});
          return;
        } else {
          interaction.editReply(`Can't play ${query}.`);
          return;
        }
      }

      case ('current'): {
        interaction.editReply({embeds: [voice.getCurrentSong()]});
        return;
      }

      case ('skip'): {
        interaction.editReply({embeds: [voice.skipSong()]});
        return;
      }

      case ('shuffle'): {
        interaction.editReply({embeds: [voice.shuffle()]});
        return;
      }
    }
    interaction.editReply('OOP');
    return 'N/A';
  },
};
