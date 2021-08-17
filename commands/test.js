const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('test')
		.setDescription('Replies with Pong!'),
	async execute(client, interaction) {
		return interaction.reply({content: "AHHHHHHH BICDICKY DON'T TOUCH ME THERE", tts: true});
	},
};