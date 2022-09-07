const Keyv = require("keyv");
const {KeyvFile} = require("keyv-file");
const {SlashCommandBuilder} = require("@discordjs/builders");
const {InteractionCollector, MessageEmbed} = require("discord.js");
const embed = require("../helpers/embed.js");
const anime = require("../helpers/anime.js");
const button = require("../helpers/buttons.js");
const chart = require("../helpers/chart.js");
const path = require("path");

const dbAnime = require("../databaseHelpers/anime.js");

// Databases
const db = new Keyv({
  store: new KeyvFile({
    filename: "storage/anime.json",
    encode: JSON.stringify,
    decode: JSON.parse,
  }),
});

const messages = new Keyv({
  store: new KeyvFile({
    filename: "storage/messages.json",
    encode: JSON.stringify,
    decode: JSON.parse,
  }),
});

function trailerParse(data) {
  if (data == null) {
    return null;
  } else if (data.site == "youtube") {
    return "https://youtu.be/" + data.id;
  } else if (data.site == "dailymotion") {
    return "https://dai.ly/" + data.id;
  }
}

async function saveVaCharacters(characters) {
  dbAnime.put("vaCharacterLength", characters.length);
  for (let i = 0; i < characters.length; i++) {
    const characterEmbed = embed.characterEmbed(characters[i]);
    dbAnime.putEmbed("vaCharacter" + i, characterEmbed);
  }
}

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

async function disablePrevious(client, newMessage, prefix) {
  try {
    const channelId = await messages.get(`anime-${prefix}_channelId`);
    const channel = await client.channels.fetch(channelId);
    const oldMessageId = await messages.get(`anime-${prefix}_message_id`);
    const oldMessage = await channel.messages.fetch(oldMessageId);
    const buttons = button.disableAllButtons(oldMessage.components);
    oldMessage.edit({components: buttons});
  } catch (error) {
    console.log(`[Anime-${prefix}] Could not find previous message.`);
  } finally {
    await messages.set(`anime-${prefix}_channelId`, newMessage.channelId);
    await messages.set(`anime-${prefix}_message_id`, newMessage.id);
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

    switch (type) {
      case "show": {
        let malResponse = undefined;
        let anithemeResponse = undefined;
        if (query.startsWith("id: ")) {
          const id = query.slice(4);
          malResponse = await anime.malShowId(id);
          anithemeResponse = await anime.anithemeSearchMalId(id);
        } else {
          malResponse = await anime.malShow(query);
          anithemeResponse = await anime.anithemeSearchMalId(malResponse.id);
          anilistResponse = await anime.anilistAiringTrend(malResponse.id);
          const [airingTrendLabels, airingTrendData] = anilistAiringTrendParse(anilistResponse);
          await chart.generateLineChart("Airing Score", airingTrendLabels, airingTrendData);
        }
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
        const message = await interaction.fetchReply();
        disablePrevious(client, message, type);
        animeShowButtonInteraction(client, message);
        return `${type}_${query}`;
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
        return `${type}_${query}`;
      }
    }
  },
};

function animeShowButtonInteraction(client, message) {
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
