const { MessageEmbed } = require('discord.js');

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