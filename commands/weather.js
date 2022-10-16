const { SlashCommandBuilder } = require("@discordjs/builders");
const { weatherEmbedBuilder, basicEmbedBuilder } = require("../utils/embed");
const weather = require("../utils/weather");
const { logger } = require("../utils/logger");
module.exports = {
  data: new SlashCommandBuilder()
    .setName("weather")
    .setDescription("What is the weather?")
    .addStringOption((option) => option.setName("location").setDescription("Where").setRequired(true)),
  async execute(client, interaction) {
    await interaction.deferReply();
    const location = interaction.options.getString("location");
    logger.info(`[Command] Weather | Location: ${location}`);
    const response = await weather.sendGetRequestWeather(location);
    if (response) {
      const embed = weatherEmbedBuilder(response);
      interaction.editReply({ embeds: [embed] });
    } else {
      const embed = basicEmbedBuilder(`Can not find ${location}`);
      interaction.editReply({ embeds: [embed] });
    }
  },
};
