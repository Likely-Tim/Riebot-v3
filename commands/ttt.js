const { SlashCommandBuilder } = require('@discordjs/builders');
// const { MessageActionRow, MessageButton } = require('discord.js');
// const { MessageEmbed } = require('discord.js')

// const r0c0 = new MessageButton()
// 					.setCustomId('r0c0')
//           .setEmoji("⬜️");
// const r0c1 = new MessageButton()
// 					.setCustomId('r0c1')
//           .setEmoji("⬜️");
// const r0c2 = new MessageButton()
// 					.setCustomId('r0c2')
//           .setEmoji("⬜️");
  
// const row0 = new MessageActionRow()
//           .addComponents(r0c0, r0c1, r0c2)

module.exports = {
  data: new SlashCommandBuilder()
		.setName('ttt')
 		.setDescription('Tic Tac Toe'),
 	async execute(client, interaction) {
 		return interaction.reply({content: "testing"});
	},
};