const {SlashCommandBuilder} = require("@discordjs/builders");
const {InteractionCollector} = require("discord.js");
const {logger} = require("../utils/logger");
const embed = require("../utils/embed");
const anime = require("../utils/anime");
const button = require("../utils/buttons");
const chart = require("../utils/chart");
const path = require("path");

// Databases
const dbAnime = require("../databaseUtils/anime");
const dbInteractions = require("../databaseUtils/messageInteractions");

async function saveVaCharacters(characters) {
  dbAnime.put("vaCharacterLength", characters.length);
  for (let i = 0; i < characters.length; i++) {
    const characterEmbed = embed.characterEmbed(characters[i]);
    dbAnime.putEmbed("vaCharacter" + i, characterEmbed);
  }
}

/**
 * Parses Anilist Airing Trend
 *
 * @param {Object} response - Anilist Airing Trend Response
 * @returns {Array} [Labels, Data]
 */
function anilistAiringTrendParse(response) {
  let nodes = response.trends.nodes;
  let data = [];
  let labels = [];
  for (let i = 0; i < nodes.length; i++) {
    if (!nodes[i].episode) {
      break;
    }
    data.unshift(nodes[i].averageScore);
    labels.unshift(nodes[i].episode);
  }
  return [labels, data];
}

/**
 * Disables Previous Interactions
 *
 * @param {Client} client - Discord Client
 * @param {Message} newMessage - Message that was sent
 * @param {string} type - Type of command
 */
async function disablePrevious(client, newMessage, type) {
  try {
    const previousChannelId = await dbInteractions.get(`anime-${type}_channelId`);
    const previousChannel = await client.channels.fetch(previousChannelId);
    const previousMessageId = await dbInteractions.get(`anime-${type}_messageId`);
    const previousMessage = await previousChannel.messages.fetch(previousMessageId);
    const buttons = button.disableAllButtons(previousMessage.components);
    previousMessage.edit({components: buttons});
  } catch (error) {
    console.log(error);
  } finally {
    await dbInteractions.put(`anime-${type}_channelId`, newMessage.channelId);
    await dbInteractions.put(`anime-${type}_messageId`, newMessage.id);
  }
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("anime")
    .setDescription("Weeb?")
    .addStringOption((option) =>
      option
        .setName("type")
        .setDescription("Type to search")
        .setRequired(true)
        .addChoices([
          ["show", "show"],
          ["va", "va"],
        ])
    )
    .addStringOption((option) => option.setName("query").setDescription("What to search").setRequired(true)),

  async execute(client, interaction) {
    await interaction.deferReply();
    const type = interaction.options.getString("type");
    const query = interaction.options.getString("query");
    logger.info(`[Command] Anime | Type: ${type} | Query: ${query}`);

    switch (type) {
      case "show": {
        let malSearchResponse = await anime.malShowSearch(query);
        let malDict = {};
        for (let i = 0; i < malSearchResponse.data.length; i++) {
          malDict[malSearchResponse.data[i].node.title] = malSearchResponse.data[i].node.id;
        }
        let selectComponent = button.addSelectObject(malDict);
        await interaction.editReply({components: [selectComponent]});
        const message = await interaction.fetchReply();
        disablePrevious(client, message, `${type}Search`);
        animeSearchInteraction(client, message, type);
        return;
      }

      case "va": {
        const response = await anime.anilistVa(query);
        const vaEmbed = embed.vaEmbedBuilder(response);
        if (vaEmbed.title) {
          dbAnime.putEmbed("vaEmbed", vaEmbed);
          dbAnime.put("vaName", response.name.full);
          saveVaCharacters(response.characters.edges);
          await interaction.editReply({embeds: [vaEmbed], components: [button.actionRow(["characters"])]});
        } else {
          await interaction.editReply({embeds: [vaEmbed], components: []});
        }
        const message = await interaction.fetchReply();
        disablePrevious(client, message, type);
        animeVAButtonInteraction(client, message);
        return;
      }
    }
  },
};

function animeSearchInteraction(client, message, type) {
  logger.info(`[Collector] Anime Search Message ID: ${message.id}`);
  const collector = new InteractionCollector(client, {message});
  collector.on("collect", async (interaction) => {
    interaction.deferReply();
    const id = interaction.values[0];
    let malResponse = await anime.malShowId(id);
    let anithemeResponse = await anime.anithemeSearchMalId(id);
    let anilistResponse = await anime.anilistAiringTrend(id);
    const [airingTrendLabels, airingTrendData] = anilistAiringTrendParse(anilistResponse);
    await chart.generateLineChart("Airing Score", airingTrendLabels, airingTrendData);
    const opEdEmbed = embed.opEdEmbedsBuilder(anithemeResponse);
    dbAnime.putEmbed("showOpEdEmbed", opEdEmbed);
    const malShowEmbed = embed.showEmbedBuilderMal(malResponse);
    dbAnime.putEmbed("malShowEmbed", malShowEmbed);
    let showButton = undefined;
    if (malShowEmbed.title) {
      showButton = button.changeLabel(button.returnButton("show"), malShowEmbed.title);
      showButton.disabled = true;
    }
    let components = [];
    if (opEdEmbed) {
      components.push(showButton);
      components.push("opEdSongs");
      components.push("score");
      components = button.merge(components);
      await interaction.editReply({embeds: [malShowEmbed], components: [components]});
    } else {
      components.push(showButton);
      components.push("score");
      components = button.merge(components);
      await interaction.editReply({embeds: [malShowEmbed]});
    }
    message = await interaction.fetchReply();
    disablePrevious(client, message, type);
    animeShowButtonInteraction(client, message);
  });
}

function animeShowButtonInteraction(client, message) {
  logger.info(`[Collector] Anime Show Message ID: ${message.id}`);
  const collector = new InteractionCollector(client, {message});
  collector.on("collect", async (press) => {
    const messageActionRows = press.message.components;
    if (press.customId == "opEdSongs") {
      const components = button.enableAllButOne(messageActionRows[0], "opEdSongs");
      const showOpEdEmbed = await dbAnime.getEmbed("showOpEdEmbed");
      await press.update({embeds: [showOpEdEmbed], components: [components], files: []});
    } else if (press.customId == "show") {
      const components = button.enableAllButOne(messageActionRows[0], "show");
      const malShowEmbed = await dbAnime.getEmbed("malShowEmbed");
      await press.update({embeds: [malShowEmbed], components: [components], files: []});
    } else if (press.customId == "score") {
      const components = button.enableAllButOne(messageActionRows[0], "score");
      await press.update({embeds: [], components: [components], files: [path.join(__dirname, "../media/animeShow.png")]});
    }
  });
}

function animeVAButtonInteraction(client, message) {
  logger.info(`[Collector] Anime VA Message ID: ${message.id}`);
  const collector = new InteractionCollector(client, {message: message, componentType: "BUTTON"});
  collector.on("collect", async (press) => {
    const name = await dbAnime.get("vaName");
    const vaButton = button.changeLabel(button.returnButton("va"), name);
    const vaCharacterLength = parseInt(await dbAnime.get("vaCharacterLength"));
    if (press.customId == "characters") {
      const characterEmbed = await dbAnime.getEmbed("vaCharacter0");
      dbAnime.put("vaCharactersIndex", 0);
      if (vaCharacterLength == 1) {
        const components = button.merge(["disabled_prev", "disabled_next", vaButton]);
        await press.update({
          embeds: [characterEmbed],
          components: [components],
        });
      } else {
        const components = button.merge(["disabled_prev", "next", vaButton]);
        await press.update({
          embeds: [characterEmbed],
          components: [components],
        });
      }
    } else if (press.customId == "next") {
      let index = parseInt(await dbAnime.get("vaCharactersIndex"));
      index += 1;
      await dbAnime.put("vaCharactersIndex", index);
      const characterEmbed = await dbAnime.getEmbed("vaCharacter" + index);
      if (vaCharacterLength - index != 1) {
        const components = button.merge(["prev", "next", vaButton]);
        await press.update({
          embeds: [characterEmbed],
          components: [components],
        });
      } else {
        const components = button.merge(["prev", "disabled_next", vaButton]);
        await press.update({
          embeds: [characterEmbed],
          components: [components],
        });
      }
    } else if (press.customId == "prev") {
      let index = parseInt(await dbAnime.get("vaCharactersIndex"));
      index -= 1;
      await dbAnime.put("vaCharactersIndex", index);
      const characterEmbed = await dbAnime.getEmbed("vaCharacter" + index);
      if (index == 0) {
        const components = button.merge(["disabled_prev", "next", vaButton]);
        await press.update({
          embeds: [characterEmbed],
          components: [components],
        });
      } else {
        const components = button.merge(["prev", "next", vaButton]);
        await press.update({
          embeds: [characterEmbed],
          components: [components],
        });
      }
    } else if (press.customId == "va") {
      const vaEmbed = await dbAnime.getEmbed("vaEmbed");
      await press.update({
        embeds: [vaEmbed],
        components: [button.actionRow(["characters"])],
      });
    }
  });
}

module.exports.animeShowButtonInteraction = animeShowButtonInteraction;
module.exports.animeVAButtonInteraction = animeVAButtonInteraction;
module.exports.animeSearchInteraction = animeSearchInteraction;
