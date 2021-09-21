const fetch = require("node-fetch");
const CryptoJS = require("crypto-js");
const Keyv = require('keyv');
const { KeyvFile } = require('keyv-file');
const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageActionRow, MessageButton, InteractionCollector, MessageEmbed } = require('discord.js');
const embed = require('../helpers/embed.js');
const anime = require('../helpers/anime.js');
const youtube = require('../helpers/youtube.js');
const button = require('../helpers/buttons.js');

const MAL_LOGO = 'https://image.myanimelist.net/ui/OK6W_koKDTOqqqLDbIoPAiC8a86sHufn_jOI-JGtoCQ';
const ANI_LOGO = 'https://anilist.co/img/icons/android-chrome-512x512.png';

// Databases
const db = new Keyv({
  store: new KeyvFile({
    filename: `storage/anime.json`,
    encode: JSON.stringify,
    decode: JSON.parse
  })
});

const messages = new Keyv({
  store: new KeyvFile({
    filename: `storage/messages.json`,
    encode: JSON.stringify,
    decode: JSON.parse
  })
});

function show_embed_builder_mal(response) {
  const result = new MessageEmbed();
  if(response == "No show found!") {
    return result.setDescription(response);
  }
  result.setTitle(response.title);
  let link = "https://myanimelist.net/anime/" + response.id;
  result.setURL(link);
  result.setAuthor(embed.studio_list("mal", response.studios), MAL_LOGO);
  result.setDescription(response.synopsis);
  result.setThumbnail(response.main_picture.large);
  let opening_themes = embed.song_list(response.opening_themes);
  let ending_themes = embed.song_list(response.ending_themes); 
  let songs = opening_themes + ending_themes;
  if(opening_themes.length > 1024) {
    opening_themes = opening_themes.substring(0, 1020) + "...";
  }
  if(ending_themes.length > 1024) {
    ending_themes = ending_themes.substring(0, 1020) + "...";
  }
  result.addFields(
    {name: ":notes: Opening Themes", value: opening_themes, inline: true}, 
    {name: ":notes: Ending Themes", value: ending_themes, inline:true}, 
    {name: '\u200B', value: '\u200B' }, 
    {name: ":trophy: Rank", value: `➤ ${embed.null_check(response.rank)}`, inline: true}, 
    {name: ":alarm_clock: Episodes", value: `➤ ${embed.episode_check(response.num_episodes)}`, inline: true}, 
    {name: ":100: Rating", value: `➤ ${embed.null_check(response.mean)}`, inline: true}
  );
  result.setColor(embed.color_picker(response.status));
  return [result, songs];
}

function show_embed_builder_anilist(response) {
  let result = new MessageEmbed();
  let trailer = trailer_save(response.trailer);
  result.setTitle(response.title.romaji)
  result.setURL(response.siteUrl);
  result.setAuthor(embed.studio_list("anilist", response.studios.nodes), ANI_LOGO);
  if(response.description == null) {
    result.setDescription("TBA");
  } else {
    result.setDescription(response.description.replaceAll('<br>', ''));
  }
  result.setThumbnail(response.coverImage.extraLarge);
  let rank = embed.anilist_rank(response.rankings);
  result.addFields(
    {name: '\u200B', value: '\u200B' }, 
    {name: ":trophy: Rank", value: `➤ ${rank}`, inline: true}, 
    {name: ":alarm_clock: Episodes", value: `➤ ${response.episodes}`, inline: true}, 
    {name: ":100: Rating", value: `➤ ${response.meanScore}`, inline: true}
  );
  result.setColor(embed.color_picker(response.status));
  return [result, response.idMal, trailer];
}

function trailer_save(data) {
  if(data == null) {
    db.set("show_trailer", "None");
    return false;
  }
  if(data.site == "youtube") {
    db.set("show_trailer", "https://youtu.be/" + data.id);
  } else if (data.site == "dailymotion") {
    db.set("show_trailer", "https://dai.ly/" + data.id);
  }
  return true;
}

function va_embed_builder(response) {
  db.set("va_name", response.name.full);
  const result = new MessageEmbed();
  if(response == null) {
    result.setDescription("No voice actor found!");
    return result;
  }
  result.setTitle(`${response.name.full} (${response.name.native})`);
  result.setURL(response.siteUrl);
  result.setThumbnail(response.image.large);
  result.setDescription(`${embed.age(response.age)}${embed.anilist_date(response.dateOfBirth)}${embed.active_since(response.yearsActive)}${embed.home_town(response.homeTown)}${embed.anilist_text(response.description)}`);
  return result;
}

async function vaCharacters_embed_builder(input) {
  const result = new MessageEmbed();
  let character = await db.get("va_characters_" + input);
  result.setTitle(character.node.name.full);
  result.setURL(character.node.siteUrl);
  result.setThumbnail(character.node.image.large);
  result.setDescription(`Role: ${character.role}\n\n${embed.anilist_text(character.node.description)}\n\n${embed.character_media(character.media)}`);
  return result;
}

async function save_va_characters(response) {
  db.set("va_characters", response.length);
  for(let i = 0; i < response.length; i++) {
    db.set("va_characters_" + i, response[i]);
  }
}

async function disable_previous(client, new_message, prefix) {
  try {
    const channel_id = await messages.get(`anime-${prefix}_channel_id`);
    const channel = await client.channels.fetch(channel_id);
    const old_message_id = await messages.get(`anime-${prefix}_message_id`);
    const old_message = await channel.messages.fetch(old_message_id);
    let buttons = button.disable_all_buttons(old_message.components);
    old_message.edit({components: buttons });
  } catch (error) {
    console.log(`[Anime-${prefix}] Could not find previous message.`);
  } finally {
    await messages.set(`anime-${prefix}_channel_id`, new_message.channelId);
    await messages.set(`anime-${prefix}_message_id`, new_message.id);
  }
}

module.exports = {
	data: new SlashCommandBuilder()
		.setName('anime')
		.setDescription('Weeb?')
    .addStringOption(option => option.setName("type").setDescription("Type to search").setRequired(true).addChoices([["show", "show"], ["va", "va"]]))
    .addStringOption(option => option.setName("query").setDescription("What to search").setRequired(true)),

	async execute(client, interaction) {
    let type = interaction.options.getString("type");
    let query = interaction.options.getString("query");

    switch (type) {
      case ("show"): {
        db.set("youtube_search", "");
        let response = await anime.anilist_show(query);
        // Anilist found show
        if(response != "No show found!") {
          let result = show_embed_builder_anilist(response);
          anilist_embed = result[0];
          db.set("anilist_show_embed", anilist_embed);
          response = await anime.mal_searchId(result[1]);
          let embed = show_embed_builder_mal(response);
          db.set("mal_show_embed", embed[0]);
          let components = [];
          let select = button.add_select(embed[1].split('\n'));
          if(select != undefined) {
            components.push(select);
            if(result[2]) {
              let url = await db.get("show_trailer");
              components.push(button.merge(["search", "anilist", button.link_button(url)]));
            } else {
              components.push(button.merge(["search", "anilist"]));
            }
          } else {
            if(result[2]) {
              let url = await db.get("show_trailer");
              components.push(button.merge(["anilist", button.link_button(url)]));
            } else {
              components.push(button.merge(["anilist"]));
            }
          } 
          await interaction.reply({ embeds: [embed[0]], components: components });
        } else {
          response = await anime.mal_search(query);
          let embed = show_embed_builder_mal(response);
          let components = [];
          let select = button.add_select(embed[1].split('\n'));
          if(select != undefined) {
            components.push(select);
            components.push(button.merge(["search"]));
          }
          await interaction.reply({ embeds: [embed[0]], components: components });
        }
        const message = await interaction.fetchReply();
        disable_previous(client, message, type);
        anime_show_button_interaction(client, message);
        return `${type}_${query}`;
      }

      case ("va"): {
        let response = await anime.anilist_va(query);
        if(response == null) {
          let embed = new MessageEmbed().setDescription("No va found");
          await interaction.reply({ embeds: [embed] });
        } else {
          save_va_characters(response.characters.edges);
          let embed = va_embed_builder(response);
          db.set("current_va", embed);
          await interaction.reply({ embeds: [embed], components: [button.action_row(["characters"])] });
        }
        const message = await interaction.fetchReply();
        disable_previous(client, message, type);
        anime_va_button_interaction(client, message);
        return `${type}_${query}`;
      }
    }
	},
};

function anime_show_button_interaction(client, message) {
  let collector = new InteractionCollector(client, {message: message });
  collector.on("collect", async press => {
    if(press.isButton()) {
      let components = press.message.components;
      if(press.customId == "anilist") {
        let embed = await db.get("anilist_show_embed");
        let components = press.message.components;
        components[1] = button.replace(components[1], "anilist", "mal");
        await press.update({ embeds: [embed], components: components });
      } else if(press.customId == "mal") {
        let embed = await db.get("mal_show_embed");
        let components = press.message.components;
        components[1] = button.replace(components[1], "mal", "anilist");
        await press.update({ embeds: [embed], components: components });
      } else if(press.customId == "search") {
        let query = await db.get("youtube_search");
        if(query == "") {
          press.reply({ephemeral: true, content: "Select from the drop down menu!"});
        } else {
          let response = await youtube.search(query);
          press.reply(response);
        }
      }
    } else if(press.isSelectMenu()) {
      let value = press.values[0];
      let components = press.message.components;
      button.set_default(components[0].components[0], value);
      db.set("youtube_search", value);
      press.update({components: components});
    }
  });
}

function anime_va_button_interaction(client, message) {
  let collector = new InteractionCollector(client, {message: message, componentType: "BUTTON"});
  collector.on("collect", async press => {
    let name = await db.get("va_name");
    let va_button = button.return_button("va");
    va_button.setLabel(name);
    let value = await db.get("va_characters");
    if(press.customId == "characters") {
      let name = await db.get("va_name");
      let va_button = button.change_label(button.return_button("va"), name);
      let character_embed = await vaCharacters_embed_builder(0);
      db.set("vaCharacters_counter", 0);
      if(value == 1) {
        let components = button.merge(["disabled_prev", "disabled_next", va_button]);
        await press.update({ embeds: [character_embed], components: [components] })
      } else {
        let components = button.merge(["disabled_prev", "next", va_button]);
        await press.update({ embeds: [character_embed], components: [components] });
      }
    } else if(press.customId == "next") {
      let name = await db.get("va_name");
      let va_button = button.change_label(button.return_button("va"), name);
      let counter = await db.get("vaCharacters_counter");
      counter += 1;
      db.set("vaCharacters_counter", counter);
      let character_embed = await vaCharacters_embed_builder(counter);
      if(value - counter != 1) {
        let components = button.merge(["prev", "next", va_button]);
        await press.update({ embeds: [character_embed], components: [components] });
      } else {
        let components = button.merge(["prev", "disabled_next", va_button]);
        await press.update({ embeds: [character_embed], components: [components] });
      }

    } else if(press.customId == "prev") {
      let name = await db.get("va_name");
      let va_button = button.change_label(button.return_button("va"), name);
      let counter = await db.get("vaCharacters_counter");
      counter -= 1;
      db.set("vaCharacters_counter", counter);
      let character_embed = await vaCharacters_embed_builder(counter);
      if(counter == 0) {
        let components = button.merge(["disabled_prev", "next", va_button]);
        await press.update({ embeds: [character_embed], components: [components] });
      } else {
        let components = button.merge(["prev", "next", va_button]);
        await press.update({ embeds: [character_embed], components: [components] });
      }
    } else if(press.customId == "va") {
      let embed = await db.get("current_va");
      await press.update({ embeds: [embed], components: [button.action_row(["characters"])] })
    } 
  });
}

module.exports.anime_show_button_interaction = anime_show_button_interaction;
module.exports.anime_va_button_interaction = anime_va_button_interaction;