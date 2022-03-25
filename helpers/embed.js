const { MessageEmbed } = require('discord.js');

const MAL_LOGO = 'https://image.myanimelist.net/ui/OK6W_koKDTOqqqLDbIoPAiC8a86sHufn_jOI-JGtoCQ';
const ANI_LOGO = 'https://anilist.co/img/icons/android-chrome-512x512.png';

function basic_embed_builder(string) {
  const result = new MessageEmbed();
  result.setDescription(string);
  return result;
}

function song_current_song_embed_builder(response, progress_bar) {
  const result = new MessageEmbed();
  result.setTitle("Current Song");
  let description = "Nothing Playing.";
  if(response != undefined) {
    description = `${response.name}\n\n${progress_bar}`;
    result.setThumbnail(response.thumbnail);
  }
  result.setDescription(description);
  return result;
}

function song_queue_embed_builder(response) {
  const result = new MessageEmbed();
  result.setTitle("Current Queue");
  let description = song_queue_description(response);
  if(description == "") {
    description = "Nothing Playing";
  } else {
    result.setThumbnail(response[0].thumbnail);
  }
  result.setDescription(description);
  return result;
}

function song_queue_description(response) {
  let result = "";
  for(let i = 0; i < response.length; i++) {
    let entry = `${i+1}. [${response[i].name}](${response[i].url})\n`;
    if(result.length + entry.length >= 4050) {
      result += `${response.length - i} more songs...`
      break;
    } else {
      result += entry;
    }
  }
  return result;
}

function show_embed_builder_mal(response) {
  const result = new MessageEmbed();
  if(response == "No show found!") {
    return result.setDescription(response);
  }
  if(response.error != undefined) {
    return [default_embed(), ''];
  }
  result.setTitle(response.title);
  let link = "https://myanimelist.net/anime/" + response.id;
  result.setURL(link);
  result.setAuthor({name: studio_list("mal", response.studios), iconURL: MAL_LOGO});
  result.setDescription(response.synopsis);
  result.setThumbnail(response.main_picture.large);
  let opening_themes = song_list(response.opening_themes);
  let ending_themes = song_list(response.ending_themes); 
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
    {name: ":trophy: Rank", value: `➤ ${null_check(response.rank)}`, inline: true}, 
    {name: ":alarm_clock: Episodes", value: `➤ ${episode_check(response.num_episodes)}`, inline: true}, 
    {name: ":100: Rating", value: `➤ ${null_check(response.mean)}`, inline: true}
  );
  result.setColor(color_picker(response.status));
  return [result, songs];
}

function show_embed_builder_anilist(response) {
  let result = new MessageEmbed();
  result.setTitle(response.title.romaji);
  result.setURL(response.siteUrl);
  result.setAuthor({name: studio_list("anilist", response.studios.nodes), iconURL: ANI_LOGO});
  if(response.description == null) {
    result.setDescription("TBA");
  } else {
    result.setDescription(response.description.replaceAll('<br>', ''));
  }
  result.setThumbnail(response.coverImage.extraLarge);
  let rank = anilist_rank(response.rankings);
  result.addFields(
    {name: '\u200B', value: '\u200B' }, 
    {name: ":trophy: Rank", value: `➤ ${rank}`, inline: true}, 
    {name: ":alarm_clock: Episodes", value: `➤ ${response.episodes}`, inline: true}, 
    {name: ":100: Rating", value: `➤ ${response.meanScore}`, inline: true}
  );
  result.setColor(color_picker(response.status));
  return [result, response.idMal, response.trailer];
}

function default_embed() {
  let result = new MessageEmbed();
  result.setDescription('Not found');
  return result;
}

function null_check(data) {
  if(data == null) {
    return "N/A";
  } else {
    return data;
  }
}

function color_picker(status) {
  switch (status) {
    case("currently_airing"): {
      return "#22fc00";
    }

    case("RELEASING"): {
      return "#22fc00";
    }

    case("finished_airing"): {
      return "#2b00ff";
    }

    case("FINISHED"): {
      return "#2b00ff";
    }

    case("not_yet_aired"): {
      return "#ff1100";
    }

    case("NOT_YET_RELEASED"): {
      return "#ff1100";
    }

    default: {
      return "#ffffff";
    }
  }
}

function song_list(songs) {
  if(typeof songs == "undefined") {
    return "N/A\n";
  } else {
    let result = "";
    for(i = 0; i < songs.length; i++) {
      result += songs[i].text + '\n';
    }
    return result;
  }
}

function studio_list(type, studios) {
  if(type == "mal") {
    if(studios.length == 0) {
      return "N/A";
    }
    let studio = studios[0].name;
    for(i = 1; i < studios.length; i++) {
      studio += ", " + studios[i].name;
    }
    return studio;
  } else {
    let studio = [];
    for(let i = 0; i < studios.length; i++) {
      if(studios[i].isAnimationStudio == true) {
        studio.push(studios[i].name);
      }
    }
    return studio.join(", ");
  }
}

function episode_check(data) {
  if(data == 0) {
    return "Unknown";
  } else {
    return data;
  }
}

function anilist_rank(data) {
  let rank = "N/A";
  for(let i = 0; i < data.length; i++) {
    if(data[i].allTime == true && data[i].type == "RATED") {
      rank = data[i].rank;
      break;
    }
  }
  return rank;
}

function anilist_text(input) {
  if(input == null) {
    return "N/A";
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

function character_media(input) {
  let media = "**Media**\n";
  for(let i = 0; i < input.length; i++) {
    media += `-[${input[i].title.romaji}${title_null(input[i].title.english)}](${input[i].siteUrl})\n`;
  }
  return media;
}

function anilist_date(input) {
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


function title_null(input) {
  if(input == null) {
    return "";
  }
  return ` (${input})`;
}


module.exports.null_check = null_check;
module.exports.color_picker = color_picker;
module.exports.song_list = song_list;
module.exports.studio_list = studio_list;
module.exports.episode_check = episode_check;
module.exports.anilist_rank = anilist_rank;
module.exports.anilist_text = anilist_text;
module.exports.character_media = character_media;
module.exports.anilist_date = anilist_date;
module.exports.active_since = active_since;
module.exports.age = age;
module.exports.home_town = home_town;
module.exports.default_embed = default_embed;
module.exports.show_embed_builder_mal = show_embed_builder_mal;
module.exports.show_embed_builder_anilist = show_embed_builder_anilist;
module.exports.song_queue_embed_builder = song_queue_embed_builder;
module.exports.song_current_song_embed_builder = song_current_song_embed_builder;
module.exports.basic_embed_builder = basic_embed_builder;