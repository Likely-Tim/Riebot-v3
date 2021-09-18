const fetch = require("node-fetch");
const CryptoJS = require("crypto-js");
const Keyv = require('keyv');
const { KeyvFile } = require('keyv-file');
const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageActionRow, MessageButton, InteractionCollector, MessageEmbed } = require('discord.js');
const embed = require('../helpers/embed.js');
const anime = require('../helpers/anime.js');



// Secrets
const MALID = process.env['MAL ID'];
const MALSecret = process.env['MAL SECRET'];
const PASSWORD = process.env['PASSWORD'];

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

const tokens = new Keyv({
  store: new KeyvFile({
    filename: `storage/tokens.json`,
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

// Buttons
const vaCharactersButton = new MessageButton()
					.setCustomId('vaCharacters')
          .setLabel("Characters")
					.setStyle('PRIMARY');
const anilist_show = new MessageButton()
					.setCustomId('anilist')
          .setLabel("Anilist")
					.setStyle('PRIMARY');
const anilist_show_disabled = new MessageButton()
					.setCustomId('anilist')
          .setLabel("Anilist")
					.setStyle('PRIMARY')
          .setDisabled(true);
const mal_show = new MessageButton()
					.setCustomId('mal')
          .setLabel("MAL")
					.setStyle('PRIMARY');
const mal_show_disabled = new MessageButton()
					.setCustomId('mal')
          .setLabel("MAL")
					.setStyle('PRIMARY')
          .setDisabled(true);
const vaCharactersButton_disabled = new MessageButton()
          .setCustomId('vaCharacters')
          .setLabel("Characters")
          .setStyle('PRIMARY')
          .setDisabled(true);
const va = new MessageButton()
					.setCustomId('va')
          .setLabel("temp")
					.setStyle('SECONDARY');
const va_disabled = new MessageButton()
          .setCustomId('va')
          .setLabel("temp")
          .setStyle('SECONDARY')
          .setDisabled(true);
const next = new MessageButton()
					.setCustomId('next')
					.setStyle('SECONDARY')
          .setEmoji("➡️");
const prev = new MessageButton()
					.setCustomId('prev')
					.setStyle('SECONDARY')
          .setEmoji("⬅️");
const next_disabled = new MessageButton()
          .setCustomId('next')
					.setStyle('SECONDARY')
          .setEmoji("➡️")
          .setDisabled(true);
const prev_disabled = new MessageButton()
          .setCustomId('prev')
					.setStyle('SECONDARY')
          .setEmoji("⬅️")
          .setDisabled(true);
const only_next = new MessageActionRow()
			.addComponents(prev_disabled, next, va);
const only_prev = new MessageActionRow()
			.addComponents(prev, next_disabled, va);
const button_row = new MessageActionRow()
			.addComponents(prev, next, va);
const disabled = new MessageActionRow()
			.addComponents(prev_disabled, next_disabled, va);
const va_buttons = new MessageActionRow()
			.addComponents(vaCharactersButton);
const va_buttons_disabled = new MessageActionRow()
      .addComponents(vaCharactersButton_disabled);
const anilist_button_disabled = new MessageActionRow()
      .addComponents(anilist_show_disabled);
const mal_button_disabled = new MessageActionRow()
      .addComponents(mal_show_disabled);

async function postRefreshMAL() {
  let url = "https://myanimelist.net/v1/oauth2/token";
  let refresh_token_encrypted = await tokens.get("mal_refresh");
  let refresh_token = CryptoJS.AES.decrypt(refresh_token_encrypted, PASSWORD).toString(CryptoJS.enc.Utf8);
  let data = {"client_id": MALID, "client_secret": MALSecret, "grant_type": "refresh_token", "refresh_token": refresh_token};
  let response = await fetch(url, {
      method: 'POST', 
      headers: {'Content-Type': 'application/x-www-form-urlencoded'},
      body: new URLSearchParams(data)});
  response = await response.json();
  let access_token_encrypted = CryptoJS.AES.encrypt(response.access_token, PASSWORD).toString();
  await tokens.set("mal_access", access_token_encrypted);
  refresh_token_encrypted = CryptoJS.AES.encrypt(response.refresh_token, PASSWORD).toString();
  await tokens.set("mal_refresh", refresh_token_encrypted);
}

async function sendGetRequest_search(query) {
  let url = `https://api.myanimelist.net/v2/anime?q=${query}&limit=1&nsfw=true`;
  let access_token_encrypted = await tokens.get("mal_access");
  let access_token = CryptoJS.AES.decrypt(access_token_encrypted, PASSWORD).toString(CryptoJS.enc.Utf8);
  let authorization = "Bearer " + access_token;
  let response = await fetch(url, {
      method: 'GET', 
      headers: {"Authorization": authorization}});
  if(response.status == 400) {
    return "No show found!"
  }
  if(response.status == 401) {
    await postRefreshMAL();
    return await sendGetRequest_search(query);
  }
  response = await response.json();
  let id = response.data[0].node.id;
  url = `https://api.myanimelist.net/v2/anime/${id}?fields=synopsis,opening_themes,ending_themes,mean,studio,status,num_episodes,rank,studios`;
  response = await fetch(url, {
      method: 'GET', 
      headers: {"Authorization": authorization}});
  return response.json();
}

async function sendGetRequest_searchId(id) {
  let url = `https://api.myanimelist.net/v2/anime/${id}?fields=synopsis,opening_themes,ending_themes,mean,studio,status,num_episodes,rank,studios`;
  let access_token_encrypted = await tokens.get("mal_access");
  let access_token = CryptoJS.AES.decrypt(access_token_encrypted, PASSWORD).toString(CryptoJS.enc.Utf8);
  let authorization = "Bearer " + access_token;
  let response = await fetch(url, {
      method: 'GET', 
      headers: {"Authorization": authorization}});
  if(response.status == 401) {
    await postRefreshMAL();
    return await sendGetRequest_searchId(id);
  }
  return response.json();
}

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
  result.addFields(
    {name: ":notes: Opening Themes", value: opening_themes, inline: true}, 
    {name: ":notes: Ending Themes", value: ending_themes, inline:true}, 
    {name: '\u200B', value: '\u200B' }, 
    {name: ":trophy: Rank", value: `➤ ${embed.null_check(response.rank)}`, inline: true}, 
    {name: ":alarm_clock: Episodes", value: `➤ ${embed.episode_check(response.num_episodes)}`, inline: true}, 
    {name: ":100: Rating", value: `➤ ${embed.null_check(response.mean)}`, inline: true}
  );
  result.setColor(embed.color_picker(response.status));
  return result;
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

function query_create(args) {
  let query = args.join("+");
  return encodeURIComponent(query);
}

async function disable_previous(client, new_message, prefix) {
  try {
    const channel_id = await messages.get(`anime-${prefix}_channel_id`);
    const channel = await client.channels.fetch(channel_id);
    const old_message_id = await messages.get(`anime-${prefix}_message_id`);
    const old_message = await channel.messages.fetch(old_message_id);
    let disabled = disabled_buttons(old_message);
    old_message.edit({components: [disabled]});
  } catch (error) {
    console.log(`[Anime-${prefix}] Could not find previous message.`);
  } finally {
    await messages.set(`anime-${prefix}_channel_id`, new_message.channelId);
    await messages.set(`anime-${prefix}_message_id`, new_message.id);
  }
}

function disabled_buttons(message) {
  let buttons = message.components[0].components;
  for(let i = 0; i < buttons.length; i++) {
    if(buttons[i].style != "LINK") {
      buttons[i].disabled = true;
    }
  }
  return new MessageActionRow({components: buttons});
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
    let original_query = query;

    switch (type) {
      case ("show"): {
        query = query_create(query.split(" "));
        let response = await anime.anilist_show(original_query);
        if(response != "No show found!") {
          let result = show_embed_builder_anilist(response);
          anilist_embed = result[0];
          db.set("anilist_show_embed", anilist_embed);
          response = await sendGetRequest_searchId(result[1]);
          let embed = show_embed_builder_mal(response);
          db.set("mal_show_embed", embed);
          let components = new MessageActionRow();
          if(result[2] == true) {
            let url = await db.get("show_trailer");
            let trailer_button = new MessageButton();
            trailer_button.setLabel("Trailer");
            trailer_button.setStyle("LINK");
            trailer_button.setURL(url);
            components.addComponents(anilist_show, trailer_button);
          } else {
            components.addComponents(anilist_show);
          }
          await interaction.reply({ embeds: [embed], components: [components] });
        } else {
          response = await sendGetRequest_search(query);
          let embed = show_embed_builder_mal(response);
          await interaction.reply({ embeds: [embed] });
        }
        const message = await interaction.fetchReply();
        disable_previous(client, message, type);
        anime_show_button_interaction(client, message);
        break;
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
          await interaction.reply({ embeds: [embed], components: [va_buttons] });
        }
        const message = await interaction.fetchReply();
        disable_previous(client, message, type);
        anime_va_button_interaction(client, message);
        break;
      }
    }
	},
};

function anime_show_button_interaction(client, message) {
  let collector = new InteractionCollector(client, {message: message, componentType: "BUTTON"});
  collector.on("collect", async press => {
    let trailer = await db.get("show_trailer");
    let trailer_button = new MessageButton();
    if(trailer != "None") {
      trailer_button.setLabel("Trailer");
      trailer_button.setStyle("LINK");
      trailer_button.setURL(trailer);
    }
    if(press.customId == "anilist") {
      let embed = await db.get("anilist_show_embed");
      let components = new MessageActionRow();
      if(trailer == "None") {
        components.addComponents(mal_show);
      } else {
        components.addComponents(mal_show, trailer_button);
      }
      await press.update({ embeds: [embed], components: [components] });
    } else if(press.customId == "mal") {
      let embed = await db.get("mal_show_embed");
      let components = new MessageActionRow();
      if(trailer == "None") {
        components.addComponents(anilist_show);
      } else {
        components.addComponents(anilist_show, trailer_button);
      }
      await press.update({ embeds: [embed], components: [components] });
    }
  });
}

function anime_va_button_interaction(client, message) {
  let collector = new InteractionCollector(client, {message: message, componentType: "BUTTON"});
  collector.on("collect", async press => {
    let value = await db.get("va_characters");
    let name = await db.get("va_name");
    if(press.customId == "vaCharacters") {
      only_next.components[2].label = name;
      only_prev.components[2].label = name;
      disabled.components[2].label = name;
      button_row.components[2].label = name;
      let character_embed = await vaCharacters_embed_builder(0);
      db.set("vaCharacters_counter", 0);
      if(value == 1) {
        await press.update({ embeds: [character_embed], components: [disabled] })
      } else {
        await press.update({ embeds: [character_embed], components: [only_next] });
      }
    } else if(press.customId == "next") {
      let counter = await db.get("vaCharacters_counter");
      counter += 1;
      db.set("vaCharacters_counter", counter);
      let character_embed = await vaCharacters_embed_builder(counter);
      if(value - counter != 1) {
        await press.update({ embeds: [character_embed], components: [button_row] });
      } else {
        await press.update({ embeds: [character_embed], components: [only_prev] });
      }

    } else if(press.customId == "prev") {
      let counter = await db.get("vaCharacters_counter");
      counter -= 1;
      db.set("vaCharacters_counter", counter);
      let character_embed = await vaCharacters_embed_builder(counter);
      if(counter == 0) {
        await press.update({ embeds: [character_embed], components: [only_next] });
      } else {
        await press.update({ embeds: [character_embed], components: [button_row] });
      }
    } else if(press.customId == "va") {
      let embed = await db.get("current_va");
      await press.update({ embeds: [embed], components: [va_buttons] })
    } 
  });
}

module.exports.anime_show_button_interaction = anime_show_button_interaction;
module.exports.anime_va_button_interaction = anime_va_button_interaction;