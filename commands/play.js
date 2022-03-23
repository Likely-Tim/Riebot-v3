const { SlashCommandBuilder } = require('@discordjs/builders');
const voice = require('../helpers/voice.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('play')
		.setDescription('Voice Channel Commands')
    .addStringOption(option => option.setName('task').setDescription('command').setRequired(true).addChoices([["link", "link"]]))
    .addStringOption(option => option.setName("query").setDescription("What to search")),
	async execute(client, interaction) {
    if(!interaction.member.voice.channelId) {
      interaction.reply("Not in a voice channel.");
      return;
    }
    let queue = voice.create_queue(client.player, interaction.guildId);
    await voice.join_channel(interaction.member.voice.channelId);
    const task = interaction.options.getString("task");
    const query = interaction.options.getString("query");
    
    switch(task) {
        case("link"): {
          let success = await voice.link_play(query);
          if(success) {
            interaction.reply("Playing");
            return;
          } else {
            interaction.reply(`Can't play ${query}.`);
            return;
          }
        }
    }
		interaction.reply("OOP");
    return "N/A";
	},
};