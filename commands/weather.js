const fetch = require('node-fetch');
const {MessageEmbed} = require('discord.js');
const {SlashCommandBuilder} = require('@discordjs/builders');

// Secrets
const apiKey = process.env.WEATHER_KEY;

const daysOfTheWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

async function sendGetRequestMain(zip) {
  const url = `http://api.openweathermap.org/data/2.5/weather?zip=${zip},US&appid=${apiKey}`;
  let response = await fetch(url, {method: 'GET'});
  if (response.status == 400 || response.status == 404) {
    const result = new MessageEmbed().setDescription('Invalid Zip Code');
    return result;
  }
  response = await response.json();
  const embed = startEmbed(response);
  response = await sendGetRequestForecast(response.coord.lat, response.coord.lon);
  return forecastEmbed(response, embed);
}

async function sendGetRequestForecast(lat, lon) {
  const url = `https://api.openweathermap.org/data/2.5/onecall?lat=${lat}&lon=${lon}&exclude=current,minutely,hourly&appid=${apiKey}`;
  const response = await fetch(url, {method: 'GET'});
  return response.json();
}

function startEmbed(response) {
  const currentTemp = tempConvert(response.main.temp);
  const feelsLikeTemp = tempConvert(response.main.feels_like);
  const result = new MessageEmbed();
  result.setTitle(`${response.name}, ${titleCap(response.weather[0].description)}, ${titleDate(response.dt, response.timezone)}`);
  result.setDescription(`**Current Temperature:** ${currentTemp}\n**Feels Like:** ${feelsLikeTemp}\n**Wind:** ${(response.wind.speed * 2.237).toFixed(1)} mph ${windDirection(response.wind.deg)}\n**Humidity:** ${response.main.humidity}%\n**Sunrise:** ${timeReturn(response.sys.sunrise, response.timezone)}\n**Sunset:** ${timeReturn(response.sys.sunset, response.timezone)}`);
  result.setThumbnail(`http://openweathermap.org/img/wn/${response.weather[0].icon}@2x.png`);
  return result;
}

function forecastEmbed(response, result) {
  let alerts = '';
  if (typeof response.alerts === 'undefined') {
    alerts = 'None';
  } else {
    for (let i = 0; i < response.alerts.length; i++) {
      alerts += response.alerts[i].sender_name + ': ' + response.alerts[i].event + ' (' + dateConvert(response.alerts[i].start, response.timezone_offset) + ' - ' + dateConvert(response.alerts[i].end, response.timezone_offset) + ')\n';
    }
  }
  const day = new Date((response.daily[1].dt + response.timezone_offset) * 1000).getDay();
  result.addFields({name: daysOfTheWeek[day % 7], value: `**Min:** ${tempConvert(response.daily[1].temp.min)}\n**Max:** ${tempConvert(response.daily[1].temp.max)}`, inline: true}, {name: daysOfTheWeek[(day + 1) % 7], value: `**Min:** ${tempConvert(response.daily[2].temp.min)}\n**Max:** ${tempConvert(response.daily[2].temp.max)}`, inline: true}, {name: daysOfTheWeek[(day + 2) % 7], value: `**Min:** ${tempConvert(response.daily[3].temp.min)}\n**Max:** ${tempConvert(response.daily[3].temp.max)}`, inline: true}, {name: daysOfTheWeek[(day + 3) % 7], value: `**Min:** ${tempConvert(response.daily[4].temp.min)}\n**Max:** ${tempConvert(response.daily[4].temp.max)}`, inline: true}, {name: daysOfTheWeek[(day + 4) % 7], value: `**Min:** ${tempConvert(response.daily[5].temp.min)}\n**Max:** ${tempConvert(response.daily[5].temp.max)}`, inline: true}, {
    name: 'Alerts',
    value:
  `${alerts}`,
  });

  result.setColor('#4287f5');
  return result;
}

function timeReturn(sec, offset) {
  const time = new Date((sec + offset) * 1000);
  const minutes = '0' + time.getMinutes();
  return time.getHours() + ':' + minutes.substr(-2);
}

function tempConvert(temp) {
  const cel = temp - 273.15;
  const faren = (cel * 9 / 5) + 32;
  return faren.toFixed(1) + '°F / ' + cel.toFixed(1) + '°C';
}

function windDirection(degree) {
  switch (true) {
    case (degree < 12):
      return 'N';
    case (degree < 34):
      return 'NNE';
    case (degree < 57):
      return 'NE';
    case (degree < 79):
      return 'ENE';
    case (degree < 102):
      return 'E';
    case (degree < 124):
      return 'ESE';
    case (degree < 147):
      return 'SE';
    case (degree < 169):
      return 'SSE';
    case (degree < 192):
      return 'S';
    case (degree < 214):
      return 'SSW';
    case (degree < 237):
      return 'SW';
    case (degree < 259):
      return 'WSW';
    case (degree < 282):
      return 'W';
    case (degree < 304):
      return 'WNW';
    case (degree < 327):
      return 'NW';
    case (degree < 349):
      return 'NNW';
    default:
      return 'N';
  }
}

function titleCap(string) {
  const sentence = string.toLowerCase().split(' ');
  for (let i = 0; i < sentence.length; i++) {
    sentence[i] = sentence[i][0].toUpperCase() + sentence[i].slice(1);
  }
  return sentence.join(' ');
}

function titleDate(sec, offset) {
  const time = timeReturn(sec, offset);
  let date = new Date((sec + offset) * 1000);
  date = String(Number(date.getMonth()) + 1) + '/' + date.getDate();
  return date + ' ' + time;
}

function dateConvert(sec, offset) {
  const date = new Date((sec + offset) * 1000);
  return String(Number(date.getMonth()) + 1) + '/' + date.getDate();
}

module.exports = {
  data: new SlashCommandBuilder()
      .setName('weather')
      .setDescription('What is the weather?')
      .addIntegerOption((option) => option.setName('zip').setDescription('Enter zip code').setRequired(true)),

  async execute(client, interaction) {
    const zip = interaction.options.getInteger('zip');
    const embed = await sendGetRequestMain(zip);
    interaction.reply({embeds: [embed]});
    return zip;
  },
};
