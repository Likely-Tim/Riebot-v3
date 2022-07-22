const Keyv = require('keyv');
const {KeyvFile} = require('keyv-file');
const {SlashCommandBuilder} = require('@discordjs/builders');
const {InteractionCollector, MessageEmbed} = require('discord.js');
const embed = require('../helpers/embed.js');
const anime = require('../helpers/anime.js');
const youtube = require('../helpers/youtube.js');
const button = require('../helpers/buttons.js');

// Databases
const db = new Keyv({
  store: new KeyvFile({
    filename: 'storage/anime.json',
    encode: JSON.stringify,
    decode: JSON.parse,
  }),
});

const messages = new Keyv({
  store: new KeyvFile({
    filename: 'storage/messages.json',
    encode: JSON.stringify,
    decode: JSON.parse,
  }),
});

function showEmbedBuilderMal(response) {
  return embed.showEmbedBuilderMal(response);
}

function showEmbedBuilderAnilist(response) {
  const result = embed.showEmbedBuilderAnilist(response);
  trailerSave(result[2]);
  return result;
}

function trailerSave(data) {
  if (data == null) {
    db.set('show_trailer', 'None');
    return false;
  }
  if (data.site == 'youtube') {
    db.set('show_trailer', 'https://youtu.be/' + data.id);
  } else if (data.site == 'dailymotion') {
    db.set('show_trailer', 'https://dai.ly/' + data.id);
  }
  return true;
}

function vaEmbedBuilder(response) {
  db.set('va_name', response.name.full);
  const result = new MessageEmbed();
  if (response == null) {
    result.setDescription('No voice actor found!');
    return result;
  }
  result.setTitle(`${response.name.full} (${response.name.native})`);
  result.setURL(response.siteUrl);
  result.setThumbnail(response.image.large);
  result.setDescription(`${embed.age(response.age)}${embed.anilistDate(response.dateOfBirth)}${embed.activeSince(response.yearsActive)}${embed.homeTown(response.homeTown)}${embed.anilistText(response.description)}`);
  return result;
}

async function vaCharacterEmbedBuilder(input) {
  const result = new MessageEmbed();
  const character = await db.get('va_characters_' + input);
  result.setTitle(character.node.name.full);
  result.setURL(character.node.siteUrl);
  result.setThumbnail(character.node.image.large);
  result.setDescription(`Role: ${character.role}\n\n${embed.anilistText(character.node.description)}\n\n${embed.characterMedia(character.media)}`);
  return result;
}

async function saveVaCharacters(response) {
  db.set('va_characters', response.length);
  for (let i = 0; i < response.length; i++) {
    db.set('va_characters_' + i, response[i]);
  }
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
      .setName('anime')
      .setDescription('Weeb?')
      .addStringOption((option) => option.setName('type').setDescription('Type to search').setRequired(true).addChoices([['show', 'show'], ['va', 'va']]))
      .addStringOption((option) => option.setName('query').setDescription('What to search').setRequired(true)),

  async execute(client, interaction) {
    const type = interaction.options.getString('type');
    const query = interaction.options.getString('query');

    switch (type) {
      case ('show'): {
        db.set('youtube_search', '');
        let response = await anime.anilistShow(query);
        // Anilist found show
        if (response != 'No show found!') {
          const result = showEmbedBuilderAnilist(response);
          const anilistEmbed = result[0];
          db.set('anilistShow_embed', anilistEmbed);
          response = await anime.malSearchId(result[1]);
          const embed = showEmbedBuilderMal(response);
          db.set('mal_show_embed', embed[0]);
          const components = [];
          const select = button.addSelect(embed[1].split('\n'));
          if (select != undefined) {
            components.push(select);
            if (result[2]) {
              const url = await db.get('show_trailer');
              components.push(button.merge(['search', 'anilist', button.linkButton(url)]));
            } else {
              components.push(button.merge(['search', 'anilist']));
            }
          } else {
            if (result[2]) {
              const url = await db.get('show_trailer');
              components.push(button.merge(['anilist', button.linkButton(url)]));
            } else {
              components.push(button.merge(['anilist']));
            }
          }
          await interaction.reply({embeds: [embed[0]], components});

        // Anilist search fails
        } else {
          response = await anime.malSearch(query);
          const embed = showEmbedBuilderMal(response);
          const components = [];
          const select = button.addSelect(embed[1].split('\n'));
          if (select != undefined) {
            components.push(select);
            components.push(button.merge(['search']));
          }
          await interaction.reply({embeds: [embed[0]], components});
        }
        const message = await interaction.fetchReply();
        disablePrevious(client, message, type);
        animeShowButtonInteraction(client, message);
        return `${type}_${query}`;
      }

      case ('va'): {
        const response = await anime.anilistVa(query);
        if (response == null) {
          const embed = new MessageEmbed().setDescription('No va found');
          await interaction.reply({embeds: [embed]});
        } else {
          saveVaCharacters(response.characters.edges);
          const embed = vaEmbedBuilder(response);
          db.set('current_va', embed);
          await interaction.reply({embeds: [embed], components: [button.actionRow(['characters'])]});
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
  collector.on('collect', async (press) => {
    if (press.isButton()) {
      const components = press.message.components;
      if (press.customId == 'anilist') {
        const embed = await db.get('anilistShow_embed');
        if (components[1] == undefined) {
          components[0] = button.replace(components[0], 'anilist', 'mal');
        } else {
          components[1] = button.replace(components[1], 'anilist', 'mal');
        }
        await press.update({embeds: [embed], components});
      } else if (press.customId == 'mal') {
        const embed = await db.get('mal_show_embed');
        if (components[1] == undefined) {
          components[0] = button.replace(components[0], 'mal', 'anilist');
        } else {
          components[1] = button.replace(components[1], 'mal', 'anilist');
        }
        await press.update({embeds: [embed], components});
      } else if (press.customId == 'search') {
        const query = await db.get('youtube_search');
        if (query == '') {
          press.reply({ephemeral: true, content: 'Select from the drop down menu!'});
        } else {
          const response = await youtube.search(query);
          press.reply(response);
        }
      }
    } else if (press.isSelectMenu()) {
      const value = press.values[0];
      const components = press.message.components;
      button.setDefault(components[0].components[0], value);
      db.set('youtube_search', value);
      press.update({components});
    }
  });
}

function animeVAButtonInteraction(client, message) {
  const collector = new InteractionCollector(client, {message, componentType: 'BUTTON'});
  collector.on('collect', async (press) => {
    const name = await db.get('va_name');
    const vaButton = button.returnButton('va');
    vaButton.setLabel(name);
    const value = await db.get('va_characters');
    if (press.customId == 'characters') {
      const name = await db.get('va_name');
      const vaButton = button.changeLabel(button.returnButton('va'), name);
      const characterEmbed = await vaCharacterEmbedBuilder(0);
      db.set('vaCharacters_counter', 0);
      if (value == 1) {
        const components = button.merge(['disabled_prev', 'disabled_next', vaButton]);
        await press.update({embeds: [characterEmbed], components: [components]});
      } else {
        const components = button.merge(['disabled_prev', 'next', vaButton]);
        await press.update({embeds: [characterEmbed], components: [components]});
      }
    } else if (press.customId == 'next') {
      const name = await db.get('va_name');
      const vaButton = button.changeLabel(button.returnButton('va'), name);
      let counter = await db.get('vaCharacters_counter');
      counter += 1;
      db.set('vaCharacters_counter', counter);
      const characterEmbed = await vaCharacterEmbedBuilder(counter);
      if (value - counter != 1) {
        const components = button.merge(['prev', 'next', vaButton]);
        await press.update({embeds: [characterEmbed], components: [components]});
      } else {
        const components = button.merge(['prev', 'disabled_next', vaButton]);
        await press.update({embeds: [characterEmbed], components: [components]});
      }
    } else if (press.customId == 'prev') {
      const name = await db.get('va_name');
      const vaButton = button.changeLabel(button.returnButton('va'), name);
      let counter = await db.get('vaCharacters_counter');
      counter -= 1;
      db.set('vaCharacters_counter', counter);
      const characterEmbed = await vaCharacterEmbedBuilder(counter);
      if (counter == 0) {
        const components = button.merge(['disabled_prev', 'next', vaButton]);
        await press.update({embeds: [characterEmbed], components: [components]});
      } else {
        const components = button.merge(['prev', 'next', vaButton]);
        await press.update({embeds: [characterEmbed], components: [components]});
      }
    } else if (press.customId == 'va') {
      const embed = await db.get('current_va');
      await press.update({embeds: [embed], components: [button.actionRow(['characters'])]});
    }
  });
}

module.exports.animeShowButtonInteraction = animeShowButtonInteraction;
module.exports.animeVAButtonInteraction = animeVAButtonInteraction;
