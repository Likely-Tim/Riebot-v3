const {SlashCommandBuilder} = require("@discordjs/builders");
const {logger} = require("../utils/logger");

module.exports = {
  data: new SlashCommandBuilder().setName("test").setDescription("Replies with Pong!"),
  async execute(client, interaction) {
    logger.info(`[Command] Test`);
    interaction.reply("Bop");
    return "N/A";
  },
};
