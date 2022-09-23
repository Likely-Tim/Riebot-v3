const {SlashCommandBuilder} = require("@discordjs/builders");
const {logger} = require("../utils/logger");

module.exports = {
  data: new SlashCommandBuilder().setName("ping").setDescription("Replies with Pong!"),
  async execute(client, interaction) {
    logger.info(`[Command] Ping`);
    interaction.reply("Pong!");
    return "N/A";
  },
};
