const fetch = require("node-fetch");
const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageActionRow, MessageButton, InteractionCollector } = require('discord.js');
const { MessageEmbed } = require('discord.js');
const Keyv = require('keyv');
const { KeyvFile } = require('keyv-file');
const MALSecret = process.env['MAL SECRET'];
const MALID = process.env['MAL ID'];
const Database = require("@replit/database");
const replit_db = new Database();
const mal_picture = 'https://image.myanimelist.net/ui/OK6W_koKDTOqqqLDbIoPAiC8a86sHufn_jOI-JGtoCQ';

const db = new Keyv({
  store: new KeyvFile({
    filename: `storage/anime.json`,
    encode: JSON.stringify,
    decode: JSON.parse
  })
})

// Buttons
const vaCharactersButton = new MessageButton()
					.setCustomId('vaCharacters')
          .setLabel("Characters")
					.setStyle('PRIMARY');
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

async function postRefreshMAL() {
  let url = "https://myanimelist.net/v1/oauth2/token";
  let refresh_token = await replit_db.get("mal_refresh");
  let data = {"client_id": MALID, "client_secret": MALSecret, "grant_type": "refresh_token", "refresh_token": refresh_token};
  let response = await fetch(url, {
      method: 'POST', 
      headers: {'Content-Type': 'application/x-www-form-urlencoded'},
      body: new URLSearchParams(data)});
  response = await response.json();
  await replit_db.set("mal_access", response.access_token);
  await replit_db.set("mal_refresh", response.refresh_token);
}

async function sendGetRequest_search(query) {
  let url = `https://api.myanimelist.net/v2/anime?q=${query}&limit=1&nsfw=true`;
  let access_token = await replit_db.get("mal_access");
  let authorization = "Bearer " + access_token;
  let response = await fetch(url, {
      method: 'GET', 
      headers: {"Authorization": authorization}});
  if(response.status == 400) {
    return "No show found!"
  }
  if(response.status == 401) {
    console.log("test");
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

async function sendPostRequest_va(query) {
  var search = `
    query {
      Staff (search: "${query}") { 
        name {
          full
          native
        }
        image {
          large
        }
        description
        age
        homeTown
        yearsActive
        dateOfBirth {
          year
          month
          day
        }
        siteUrl
        characters (perPage: 10, sort: [ROLE, FAVOURITES_DESC]) {
          edges {
            role
            node {
              image {
                large
              }
              siteUrl
              description
  						name {
                full
              }
              id
            }
            media {
              siteUrl
              title {
                romaji
                english
              }
            }
          }
        }
      }
    }
    `;

    let url = `https://graphql.anilist.co`;
    let response = await fetch(url, {
        method: 'POST', 
        headers: {'Content-Type': 'application/json',
                  'Accept': 'application/json'},
        body: JSON.stringify({
            query: search
        })
    });
    response = await response.json();
    return response.data.Staff;

}

function song_builder(songs) {
  let result = "";
  if(typeof songs == "undefined") {
    result = "N/A";
  } else {
    for(i = 0; i < songs.length; i++) {
      result += songs[i].text + '\n';
    }
  }
  return result;
}

function studio_builder(studios) {
  if(studios.length == [0]) {
    return "N/A";
  }
  let studio = studios[0].name;
  for(i = 1; i < studios.length; i++) {
    studio += ", " + studios[i].name;
  }
  return studio;
}

function color_picker(status) {
  switch (status) {
    case("currently_airing"): {
      return "#22fc00";
    }
    case("finished_airing"): {
      return "#2b00ff";
    }

    case("not_yet_aired"): {
      return "#ff1100";
    }

    default: {
      return "#ffffff";
    }
  }
}

function show_embed_builder(response) {
  const result = new MessageEmbed();
  if(response == "No show found!") {
    return result.setDescription(response);
  }
  result.setTitle(response.title);
  let link = "https://myanimelist.net/anime/" + response.id;
  result.setURL(link);
  result.setAuthor(studio_builder(response.studios), mal_picture);
  result.setDescription(response.synopsis);
  result.setThumbnail(response.main_picture.large);
  let opening_themes = song_builder(response.opening_themes);
  let ending_themes = song_builder(response.ending_themes); 
  result.addFields(
    {name: ":notes: Opening Themes", value: opening_themes, inline: true}, 
    {name: ":notes: Ending Themes", value: ending_themes, inline:true}, 
    {name: '\u200B', value: '\u200B' }, 
    {name: ":trophy: Rank", value: `➤ ${response.rank}`, inline: true}, 
    {name: ":alarm_clock: Episodes", value: `➤ ${response.num_episodes}`, inline: true}, 
    {name: ":100: Rating", value: `➤ ${response.mean}`, inline: true}
  );
  result.setColor(color_picker(response.status));
  return result;
}

function description_check(input) {
  if(input == null) {
    return "";
  }
  if(input.length > 1800) {
    input = input.substring(0, 1950);
    input += "...";
  }
  let start = 0;
  while(true) {
    let temp = input.indexOf("~!");
    if(temp == -1) {
      break;
    }
    input = input.replace("~!", "||");
    start++;
  }
  let end = 0;
  while(true) {
    let temp = input.indexOf("!~");
    if(temp == -1) {
      break;
    }
    input = input.replace("!~", "||");
    end++;
  }
  if(start > end) {
    input += "||";
  }
  return input;
}

function date_generator(input) {
  let date = "";
  if(input.month != null) {
    date += input.month;
  }
  if(input.day != null) {
    date += "/" + input.day;
  }
  if(input.year != null) {
    date += "/" + input.year;
  }
  if(date == "") {
    return "";
  }
  return `**DOB:** ${date}\n`;
}

function active_since(input) {
  if(input.length == 0) {
    return "";
  }
  return `**Active Since:** ${input[0]}\n`;
}

function age(input) {
  if(input == null) {
    return "";
  }
  return `**Age:** ${input}\n`;
}

function home_town(input) {
  if(input == null) {
    return "";
  }
  return `**Home Town:** ${input}\n`;
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
  result.setDescription(`${age(response.age)}${date_generator(response.dateOfBirth)}${active_since(response.yearsActive)}${home_town(response.homeTown)}${description_check(response.description)}`);
  return result;
}

function character_media(input) {
  let media = "**Media**\n";
  for(let i = 0; i < input.length; i++) {
    media += `-[${input[i].title.romaji}${title_null(input[i].title.english)}](${input[i].siteUrl})\n`;
  }
  return media;
}

function title_null(input) {
  if(input == null) {
    return "";
  }
  return ` (${input})`;
}

async function vaCharacters_embed_builder(input) {
  const result = new MessageEmbed();
  let character = await db.get("va_characters_" + input);
  result.setTitle(character.node.name.full);
  result.setURL(character.node.siteUrl);
  result.setThumbnail(character.node.image.large);
  result.setDescription(`Role: ${character.role}\n\n${description_check(character.node.description)}\n\n${character_media(character.media)}`);
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
        query = query_create(query.split(" "));
        let response = await sendGetRequest_search(query);
        let embed = show_embed_builder(response);
        return interaction.reply({ embeds: [embed] });
      }

      case ("va"): {
        let response = await sendPostRequest_va(query);
        if(response == null) {
          let embed = new MessageEmbed().setDescription("No va found");
          await interaction.reply({ embeds: [embed] });
        } else {
          save_va_characters(response.characters.edges);
          let embed = va_embed_builder(response);
          db.set("current_va", embed);
          await interaction.reply({ embeds: [embed], components: [va_buttons] });
        }

        // Buttons
        const message = await interaction.fetchReply();
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
    }
    
	},
};