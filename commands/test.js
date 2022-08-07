const { SlashCommandBuilder } = require("@discordjs/builders");
// const CryptoJS = require("crypto-js");
// const Keyv = require('keyv');
// const {KeyvFile} = require('keyv-file');

// const PASSWORD = process.env['PASSWORD']

// const tokens = new Keyv({
//   store: new KeyvFile({
//     filename: `storage/tokens.json`,
//     encode: JSON.stringify,
//     decode: JSON.parse
//   })
// });

module.exports = {
  data: new SlashCommandBuilder()
    .setName("test")
    .setDescription("Replies with Pong!"),
  async execute(client, interaction) {
    /*
    let encrypted = CryptoJS.AES.encrypt("", PASSWORD).toString();
    await tokens.set("youtube_key", encrypted);
    */
    interaction.reply("Bop");
    return "N/A";
  },
};
