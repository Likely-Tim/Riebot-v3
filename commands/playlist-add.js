const { SlashCommandBuilder } = require("@discordjs/builders");
const spotify = require("../helpers/spotify.js");
const sleep = require("util").promisify(setTimeout);

module.exports = {
  data: new SlashCommandBuilder()
    .setName("playlist-add")
    .setDescription("Add to the playlist"),
  async execute(client, interaction) {
    if (interaction.user.id != 332923810099494913n) {
      await interaction.reply(":)");
      return;
    }
    const response = await spotify.playlistAddPlaying("4f0u6dEIdEAefLS9oiM8j0");
    if (response) {
      await interaction.reply("Added");
    } else {
      await interaction.reply("Can't add");
    }
    await sleep(3000);
    await interaction.deleteReply();
  },
};
