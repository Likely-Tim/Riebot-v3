const { time } = require("@discordjs/builders");
const { MessageEmbed } = require("discord.js");
const { fahrenheitToBoth, unixTo12Hour, unixToDateAnd12Hour, unixToDay, capitalize } = require("../utils/misc");

const MAL_LOGO = "https://image.myanimelist.net/ui/OK6W_koKDTOqqqLDbIoPAiC8a86sHufn_jOI-JGtoCQ";
const ANI_LOGO = "https://anilist.co/img/icons/android-chrome-512x512.png";

function notFoundEmbed() {
  const result = new MessageEmbed();
  result.setDescription("Not found");
  return result;
}

function basicEmbedBuilder(string) {
  const result = new MessageEmbed();
  result.setDescription(string);
  return result;
}

function weatherEmbedBuilder(object) {
  const location = object.name;
  const timezone = object.timezone;
  const current = object.current;
  const forecast = object.daily;
  const alerts = object.alerts;
  const embed = new MessageEmbed();
  embed.setColor("#0099ff");
  embed.setThumbnail(`http://openweathermap.org/img/wn/${current.weather[0].icon}@2x.png`);
  embed.setTitle(`${location}, ${unixToDateAnd12Hour(current.dt, timezone)}\n${capitalize(current.weather[0].description)}`);
  embed.setDescription(`**Current Temperature:** ${fahrenheitToBoth(current.temp)}\n**Feels Like:** ${fahrenheitToBoth(current.feels_like)}\n**Min:** ${fahrenheitToBoth(forecast[0].temp.min)}\n**Max:** ${fahrenheitToBoth(forecast[0].temp.max)}\n**Humidity:** ${current.humidity}%\n**Wind:** ${current.wind_speed} mph\n**Sunrise:** ${unixTo12Hour(current.sunrise, timezone)}\n **Sunset:** ${unixTo12Hour(current.sunset, timezone)}\n**UV Index:** ${current.uvi}`);
  for (let i = 1; i < 7; i++) {
    embed.addField(unixToDay(forecast[i].dt, timezone), `**Min:** ${fahrenheitToBoth(forecast[i].temp.min)}\n**Max** ${fahrenheitToBoth(forecast[i].temp.max)}\n**Percipitation:** ${forecast[i].pop * 100}%\n**Wind Gust: ** ${forecast[i].wind_gust.toFixed(1)} mph`, true);
  }
  if (alerts) {
    const alertArray = [];
    for (let i = 0; i < alerts.length; i++) {
      alertArray.push(`**- [${unixToDateAnd12Hour(alerts[i].start, timezone)} - ${unixToDateAnd12Hour(alerts[i].end, timezone)}] ${alerts[i].event}**`);
    }
    embed.addField("Alerts", alertArray.join("\n"), false);
  }
  return embed;
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

function vaEmbedBuilder(response) {
  if (response == null) {
    return basicEmbedBuilder("No voice actor found.");
  }
  const result = new MessageEmbed();
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

function showEmbedBuilderMal(malResponse) {
  if (!malResponse) {
    return notFoundEmbed();
  }
  const result = new MessageEmbed();
  result.setTitle(malResponse.title.slice(0, 80));
  const link = "https://myanimelist.net/anime/" + malResponse.id;
  result.setURL(link);
  result.setAuthor({
    name: studioList("mal", malResponse.studios),
    iconURL: MAL_LOGO,
  });
  result.setDescription(malResponse.synopsis);
  result.setThumbnail(malResponse.main_picture.large);
  result.addFields(
    { name: "\u200B", value: "\u200B" },
    {
      name: ":trophy: Rank",
      value: `➤ ${nullCheck(malResponse.rank)}`,
      inline: true,
    },
    {
      name: ":alarm_clock: Episodes",
      value: `➤ ${episodeCheck(malResponse.num_episodes)}`,
      inline: true,
    },
    {
      name: ":100: Rating",
      value: `➤ ${nullCheck(malResponse.mean)}`,
      inline: true,
    }
  );
  result.setColor(colorPicker(malResponse.status));
  return result;
}

function opEdEmbedsBuilder(anithemeResponse) {
  if (!anithemeResponse) {
    return null;
  }
  if (anithemeResponse.anime.length == 0) {
    return "";
  }
  let [openingThemes, endingThemes] = getSongList("anitheme", anithemeResponse);
  openingThemes = openingThemes.map((theme, index) => {
    if (openingThemes.length == 1) {
      return theme;
    } else {
      return `${index + 1}. ${theme}`;
    }
  });
  endingThemes = endingThemes.map((theme, index) => {
    if (endingThemes.length == 1) {
      return theme;
    } else {
      return `${index + 1}. ${theme}`;
    }
  });
  let opEdThemes = `**Openings**\n${openingThemes.join("\n")}\n\n**Endings**\n${endingThemes.join("\n")}`;
  let link = anithemeResponse.anime[0].images[0].link;
  const opEdEmbed = new MessageEmbed();
  opEdEmbed.setTitle(anithemeResponse.anime[0].name);
  opEdEmbed.setURL(anithemeResponse.anime[0].resources[0].link);
  opEdEmbed.setThumbnail(link);
  opEdEmbed.setDescription(opEdThemes);
  return opEdEmbed;
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

function nullCheck(data) {
  if (data == null) {
    return "N/A";
  } else {
    return data;
  }
}

function colorPicker(status) {
  switch (status) {
    case "currently_airing":
    case "RELEASING": {
      return "#22fc00";
    }

    case "finished_airing":
    case "FINISHED": {
      return "#2b00ff";
    }

    case "not_yet_aired":
    case "NOT_YET_RELEASED": {
      return "#ff1100";
    }

    default: {
      return "#ffffff";
    }
  }
}

function getSongList(type, songs) {
  if (type == "mal") {
    if (!songs) {
      return ["N/A"];
    }
    let songList = [];
    for (let i = 0; i < songs.length; i++) {
      songList.push(songs[i].text);
    }
    return songList;
  } else if (type == "anitheme") {
    if (songs.anime.length == 0 || songs.anime.length > 1) {
      return [["N/A"], ["N/A"]];
    }
    const animeThemes = songs.anime[0].animethemes;
    const openingThemes = [];
    const endingThemes = [];
    for (let i = 0; i < animeThemes.length; i++) {
      let artists = [];
      for (let j = 0; j < animeThemes[i].song.artists.length; j++) {
        artists.push(animeThemes[i].song.artists[j].name);
      }
      artists = arrayJoin(artists);
      const episodes = animeThemes[i].animethemeentries[0].episodes;
      let link = "";
      try {
        link = animeThemes[i].animethemeentries[0].videos[0].link;
      } catch {}
      let animeTheme = animeThemes[i].song.title;
      if (artists) {
        animeTheme += ` by ${artists}`;
      }
      if (link) {
        animeTheme = `[${animeTheme}](${link})`;
      }
      animeTheme += ` [EP: ${episodes}]`;
      if (animeThemes[i].type == "OP") {
        openingThemes.push(animeTheme);
      } else if (animeThemes[i].type == "ED") {
        endingThemes.push(animeTheme);
      }
    }
    return [openingThemes, endingThemes];
  }
}

function arrayJoin(array) {
  if (array.length == 0) {
    return "";
  } else if (array.length == 1) {
    return array[0];
  } else if (array.length == 2) {
    return array[0] + " and " + array[1];
  } else {
    let string = array.join(", ");
    const index = string.lastIndexOf(",");
    return string.slice(0, index + 1) + " and" + string.slice(index + 1);
  }
}
function studioList(type, studios) {
  if (type == "mal") {
    const studioList = [];
    for (let i = 0; i < studios.length; i++) {
      studioList.push(studios[i].name);
    }
    return studioList.join(", ");
  } else {
    const studioList = [];
    for (let i = 0; i < studios.length; i++) {
      if (studios[i].isAnimationStudio == true) {
        studioList.push(studios[i].name);
      }
    }
    return studioList.join(", ");
  }
}

function episodeCheck(data) {
  if (data == 0) {
    return "Unknown";
  } else {
    return data;
  }
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

module.exports = { showEmbedBuilderMal, songQueueEmbedBuilder, songCurrentSongEmbedBuilder, basicEmbedBuilder, vaEmbedBuilder, characterEmbed, opEdEmbedsBuilder, weatherEmbedBuilder };
