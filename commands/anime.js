const Keyv = require("keyv");
const {KeyvFile} = require("keyv-file");
const {SlashCommandBuilder} = require("@discordjs/builders");
const {InteractionCollector, MessageEmbed} = require("discord.js");
const embed = require("../helpers/embed.js");
const anime = require("../helpers/anime.js");
const youtube = require("../helpers/youtube.js");
const button = require("../helpers/buttons.js");

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

function sanitizeAnithemesArray(openings, endings) {
  openings = openings.split("\n");
  endings = endings.split("\n");
  let songs = [];
  let regExp = /\[([^)]+)\]/;
  for (let i = 0; i < openings.length; i++) {
    let song = regExp.exec(openings[i])[1];
    song = song.slice(0, song.lastIndexOf("["));
    if (song.length > 100) {
      song = song.slice(0, 97) + "...";
    }
    songs.push(song);
  }
  for (let i = 0; i < endings.length; i++) {
    let song = regExp.exec(endings[i])[1];
    song = song.slice(0, song.lastIndexOf("["));
    if (song.length > 100) {
      song = song.slice(0, 97) + "...";
    }
    songs.push(song);
  }
  songs = [...new Set(songs)];
  songs = songs.slice(0, 25);
  console.log(songs);
  return songs;
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
    const type = interaction.options.getString("type");
    const query = interaction.options.getString("query");

    switch (type) {
      case "show": {
        const anilistResponse = await anime.anilistShow(query);
        // Anilist Show Found
        if (anilistResponse == null) {
          const anilistShowEmbed = embed.showEmbedBuilderAnilist(anilistResponse);
          dbAnime.putEmbed("anilistShowEmbed", anilistShowEmbed);
          const trailer = trailerParse(anilistResponse.trailer);
          // No corresponding MAL Entry
          if (!anilistResponse.idMal) {
            const components = [];
            if (trailer) {
              components.push(button.linkButton(trailer));
            }
            await interaction.reply({embeds: [anilistShowEmbed], components: components});
          } else {
            const anithemeResponse = await anime.anithemeSearchMalId(anilistResponse.idMal);
            const [opEmbed, edEmbed] = embed.opEdEmbedsBuilder(anithemeResponse);
            dbAnime.putEmbed("showOpEmbed", opEmbed);
            dbAnime.putEmbed("showEdEmbed", edEmbed);
            const malResponse = await anime.malShowId(anilistResponse.idMal);
            const malShowEmbed = embed.showEmbedBuilderMal(malResponse);
            dbAnime.putEmbed("malShowEmbed", malShowEmbed);
            let components = ["anilist", "opSongs", "edSongs"];
            if (trailer) {
              components.push(button.linkButton(trailer));
            }
            components = [button.merge(components)];
            await interaction.reply({embeds: [malShowEmbed], components: components});
          }
          // Anilist Search Fail
        } else {
          const malResponse = await anime.malShow(query);
          const anithemeResponse = await anime.anithemeSearchMalId(malResponse.id);
          const [opEmbed, edEmbed] = embed.opEdEmbedsBuilder(anithemeResponse);
          dbAnime.putEmbed("showOpEmbed", opEmbed);
          dbAnime.putEmbed("showEdEmbed", edEmbed);
          const malShowEmbed = embed.showEmbedBuilderMal(malResponse);
          let components = ["opSongs", "edSongs"];
          components = [button.merge(components)];
          await interaction.reply({embeds: [malShowEmbed], components: components});
        }
        await dbAnime.put("showSelectQuery", "");
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
          await interaction.reply({embeds: [vaEmbed], components: [button.actionRow(["characters"])]});
        } else {
          await interaction.reply({embeds: [vaEmbed], components: []});
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
    if (press.isButton()) {
      const components = press.message.components;
      if (press.customId == "anilist") {
        const anilistEmbed = await dbAnime.getEmbed("anilistShowEmbed");
        if (components[1] == undefined) {
          components[0] = button.replace(components[0], "anilist", "mal");
        } else {
          components[1] = button.replace(components[1], "anilist", "mal");
        }
        await press.update({embeds: [anilistEmbed], components});
      } else if (press.customId == "mal") {
        const malEmbed = await dbAnime.getEmbed("malShowEmbed");
        if (components[1] == undefined) {
          components[0] = button.replace(components[0], "mal", "anilist");
        } else {
          components[1] = button.replace(components[1], "mal", "anilist");
        }
        await press.update({embeds: [malEmbed], components});
      } else if (press.customId == "opSongs") {
        openingEmbed = await dbAnime.getEmbed("showOpEmbed");
        await press.reply({embeds: [openingEmbed]});
      } else if (press.customId == "edSongs") {
        endingEmbed = await dbAnime.getEmbed("showEdEmbed");
        await press.reply({embeds: [endingEmbed]});
      } else if (press.customId == "search") {
        const selectQuery = await dbAnime.get("showSelectQuery");
        if (!selectQuery) {
          press.reply({ephemeral: true, content: "Select from the drop down menu!"});
        } else {
          const response = await youtube.search(selectQuery);
          press.reply(response);
        }
      }
    } else if (press.isSelectMenu()) {
      const value = press.values[0];
      await dbAnime.put("showSelectQuery", value);
      const components = press.message.components;
      button.setDefault(components[0].components[0], value);
      press.update({components});
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
