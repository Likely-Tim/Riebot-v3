const { SlashCommandBuilder } = require('@discordjs/builders');
const Keyv = require('keyv');
const { KeyvFile } = require('keyv-file');

const db = new Keyv({
  store: new KeyvFile({
    filename: `storage/ttt.json`,
    encode: JSON.stringify,
    decode: JSON.parse
  })
});

module.exports = {
  data: new SlashCommandBuilder()
		.setName('ttt')
 		.setDescription('Tic Tac Toe'),

 	async execute(client, interaction) {
    db.set("start", true);
    let table = [ ['*', '*', '*'], ['*', '*', '*'], ['*', '*', '*']];
    db.set("table", table);
 		return interaction.reply({content: "testing"});
	},
};