const {MessageEmbed} = require("discord.js");

const MAL_LOGO = "https://image.myanimelist.net/ui/OK6W_koKDTOqqqLDbIoPAiC8a86sHufn_jOI-JGtoCQ";
const ANI_LOGO = "https://anilist.co/img/icons/android-chrome-512x512.png";

function basicEmbedBuilder(string) {
  const result = new MessageEmbed();
  result.setDescription(string);
  return result;
}

function songCurrentSongEmbedBuilder(response, progressBar) {
  const result = new MessageEmbed();
  result.setTitle("Current Song");
  let description = "Nothing Playing.";
  if (response != undefined) {
    description = `${response.name}\n\n${progressBar}`;
    result.setThumbnail(response.thumbnail);
  }
  result.setDescription(description);
  return result;
}

function songQueueEmbedBuilder(response) {
  const result = new MessageEmbed();
  result.setTitle("Current Queue");
  let description = songQueueDescription(response);
  if (description == "") {
    description = "Nothing Playing";
  } else {
    result.setThumbnail(response[0].thumbnail);
  }
  result.setDescription(description);
  return result;
}

function songQueueDescription(response) {
  let result = "";
  for (let i = 0; i < response.length; i++) {
    const entry = `${i + 1}. [${response[i].name}](${response[i].url})\n`;
    if (result.length + entry.length >= 4050) {
      result += `${response.length - i} more songs...`;
      break;
    } else {
      result += entry;
    }
  }
  return result;
}

function showEmbedBuilderMal(response) {
  const result = new MessageEmbed();
  if (response == "No show found!") {
    return result.setDescription(response);
  }
  if (response.error != undefined) {
    return [defaultEmbed(), ""];
  }
  result.setTitle(response.title);
  const link = "https://myanimelist.net/anime/" + response.id;
  result.setURL(link);
  result.setAuthor({
    name: studioList("mal", response.studios),
    iconURL: MAL_LOGO,
  });
  result.setDescription(response.synopsis);
  result.setThumbnail(response.main_picture.large);
  let openingThemes = songList(response.opening_themes);
  let endingThemes = songList(response.ending_themes);
  if (openingThemes.length > 1024) {
    openingThemes = openingThemes.substring(0, 1020) + "...";
  }
  if (endingThemes.length > 1024) {
    endingThemes = endingThemes.substring(0, 1020) + "...";
  }
  result.addFields(
    {name: ":notes: Opening Themes", value: openingThemes, inline: true},
    {name: ":notes: Ending Themes", value: endingThemes, inline: true},
    {name: "\u200B", value: "\u200B"},
    {
      name: ":trophy: Rank",
      value: `➤ ${nullCheck(response.rank)}`,
      inline: true,
    },
    {
      name: ":alarm_clock: Episodes",
      value: `➤ ${episodeCheck(response.num_episodes)}`,
      inline: true,
    },
    {
      name: ":100: Rating",
      value: `➤ ${nullCheck(response.mean)}`,
      inline: true,
    }
  );
  result.setColor(colorPicker(response.status));
  return result;
}

function showEmbedBuilderAnilist(response) {
  const result = new MessageEmbed();
  result.setTitle(response.title.romaji);
  result.setURL(response.siteUrl);
  result.setAuthor({
    name: studioList("anilist", response.studios.nodes),
    iconURL: ANI_LOGO,
  });
  if (response.description == null) {
    result.setDescription("TBA");
  } else {
    result.setDescription(response.description.replaceAll("<br>", ""));
  }
  result.setThumbnail(response.coverImage.extraLarge);
  const rank = anilistRank(response.rankings);
  result.addFields(
    {name: "\u200B", value: "\u200B"},
    {name: ":trophy: Rank", value: `➤ ${rank}`, inline: true},
    {
      name: ":alarm_clock: Episodes",
      value: `➤ ${response.episodes}`,
      inline: true,
    },
    {name: ":100: Rating", value: `➤ ${response.meanScore}`, inline: true}
  );
  result.setColor(colorPicker(response.status));
  return result;
}

function defaultEmbed() {
  const result = new MessageEmbed();
  result.setDescription("Not found");
  return result;
}

function nullCheck(data) {
  if (data == null) {
    return "N/A";
  } else {
    return data;
  }
}

function colorPicker(status) {
  switch (status) {
    case "currently_airing": {
      return "#22fc00";
    }

    case "RELEASING": {
      return "#22fc00";
    }

    case "finished_airing": {
      return "#2b00ff";
    }

    case "FINISHED": {
      return "#2b00ff";
    }

    case "not_yet_aired": {
      return "#ff1100";
    }

    case "NOT_YET_RELEASED": {
      return "#ff1100";
    }

    default: {
      return "#ffffff";
    }
  }
}

function songList(songs) {
  if (typeof songs === "undefined") {
    return "N/A\n";
  } else {
    let result = "";
    for (let i = 0; i < songs.length; i++) {
      result += songs[i].text + "\n";
    }
    return result;
  }
}

function studioList(type, studios) {
  if (type == "mal") {
    if (studios.length == 0) {
      return "N/A";
    }
    let studio = studios[0].name;
    for (let i = 1; i < studios.length; i++) {
      studio += ", " + studios[i].name;
    }
    return studio;
  } else {
    const studio = [];
    for (let i = 0; i < studios.length; i++) {
      if (studios[i].isAnimationStudio == true) {
        studio.push(studios[i].name);
      }
    }
    return studio.join(", ");
  }
}

function episodeCheck(data) {
  if (data == 0) {
    return "Unknown";
  } else {
    return data;
  }
}

function anilistRank(data) {
  let rank = "N/A";
  for (let i = 0; i < data.length; i++) {
    if (data[i].allTime == true && data[i].type == "RATED") {
      rank = data[i].rank;
      break;
    }
  }
  return rank;
}

function anilistText(input) {
  if (input == null) {
    return "N/A";
  }
  if (input.length > 1800) {
    input = input.substring(0, 1950);
    input += "...";
  }
  let start = 0;
  while (true) {
    const temp = input.indexOf("~!");
    if (temp == -1) {
      break;
    }
    input = input.replace("~!", "||");
    start++;
  }
  let end = 0;
  while (true) {
    const temp = input.indexOf("!~");
    if (temp == -1) {
      break;
    }
    input = input.replace("!~", "||");
    end++;
  }
  if (start > end) {
    input += "||";
  }
  return input;
}

function characterMedia(input) {
  let media = "**Media**\n";
  for (let i = 0; i < input.length; i++) {
    media += `-[${input[i].title.romaji}${titleNull(input[i].title.english)}](${input[i].siteUrl})\n`;
  }
  return media;
}

function anilistDate(input) {
  let date = "";
  if (input.month != null) {
    date += input.month;
  }
  if (input.day != null) {
    date += "/" + input.day;
  }
  if (input.year != null) {
    date += "/" + input.year;
  }
  if (date == "") {
    return "";
  }
  return `**DOB:** ${date}\n`;
}

function activeSince(input) {
  if (input.length == 0) {
    return "";
  }
  return `**Active Since:** ${input[0]}\n`;
}

function age(input) {
  if (input == null) {
    return "";
  }
  return `**Age:** ${input}\n`;
}

function homeTown(input) {
  if (input == null) {
    return "";
  }
  return `**Home Town:** ${input}\n`;
}

function titleNull(input) {
  if (input == null) {
    return "";
  }
  return ` (${input})`;
}

function vaEmbedBuilder(response) {
  const result = new MessageEmbed();
  if (response == null) {
    result.setDescription("No voice actor found!");
    return result;
  }
  result.setTitle(`${response.name.full} (${response.name.native})`);
  result.setURL(response.siteUrl);
  result.setThumbnail(response.image.large);
  result.setDescription(`${age(response.age)}${anilistDate(response.dateOfBirth)}${activeSince(response.yearsActive)}${homeTown(response.homeTown)}${anilistText(response.description)}`);
  return result;
}

function characterEmbed(character) {
  const characterEmbed = new MessageEmbed();
  characterEmbed.setTitle(character.node.name.full);
  characterEmbed.setURL(character.node.siteUrl);
  characterEmbed.setThumbnail(character.node.image.large);
  characterEmbed.setDescription(`Role: ${character.role}\n\n${anilistText(character.node.description)}\n\n${characterMedia(character.media)}`);
  return characterEmbed;
}

module.exports.defaultEmbed = defaultEmbed;
module.exports.showEmbedBuilderMal = showEmbedBuilderMal;
module.exports.showEmbedBuilderAnilist = showEmbedBuilderAnilist;
module.exports.songQueueEmbedBuilder = songQueueEmbedBuilder;
module.exports.songCurrentSongEmbedBuilder = songCurrentSongEmbedBuilder;
module.exports.basicEmbedBuilder = basicEmbedBuilder;
module.exports.vaEmbedBuilder = vaEmbedBuilder;
module.exports.characterEmbed = characterEmbed;
