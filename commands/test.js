const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js')

const embed = new MessageEmbed().setDescription("AHHHHHHH BICDICKY DON'T TOUCH ME THERE!");

module.exports = {
	data: new SlashCommandBuilder()
		.setName('test')
		.setDescription('Replies with Pong!'),
	async execute(client, interaction) {
		return interaction.reply({embeds: [embed], tts: true});
	},
};