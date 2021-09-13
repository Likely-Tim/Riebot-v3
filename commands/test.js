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
    // console.log(CryptoJS.AES.decrypt(temp, PASSWORD).toString(CryptoJS.enc.Utf8));
    let token = await replit_db.get("spotify_access");
    let temp = CryptoJS.AES.encrypt(token, PASSWORD).toString();
    await tokens.set("spotify_access", temp);
    token = await replit_db.get("spotify_refresh");
    temp = CryptoJS.AES.encrypt(token, PASSWORD).toString();
    await tokens.set("spotify_refresh", temp);
		return interaction.reply(".");
	},
};