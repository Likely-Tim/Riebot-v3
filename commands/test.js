const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js')
const CryptoJS = require("crypto-js");
const PASSWORD = process.env['PASSWORD']
const Database = require("@replit/database");
const replit_db = new Database();
const Keyv = require('keyv');
const { KeyvFile } = require('keyv-file');

const tokens = new Keyv({
  store: new KeyvFile({
    filename: `storage/tokens.json`,
    encode: JSON.stringify,
    decode: JSON.parse
  })
});

module.exports = {
	data: new SlashCommandBuilder()
		.setName('test')
		.setDescription('Replies with Pong!'),
	async execute(client, interaction) {
		interaction.reply(".");
    return "N/A";
	},
};