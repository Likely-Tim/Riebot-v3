const {SlashCommandBuilder} = require("@discordjs/builders");

module.exports = {
  data: new SlashCommandBuilder().setName("test").setDescription("Replies with Pong!"),
  async execute(client, interaction) {
    interaction.reply("Bop");
    return "N/A";
  },
};
