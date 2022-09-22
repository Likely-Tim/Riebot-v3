const {SlashCommandBuilder} = require("@discordjs/builders");
const fetch = require("node-fetch");
const path = require("path");
const {MessageEmbed} = require("discord.js");

const apiKey = process.env.VISUAL_CROSSING_KEY;

async function sendGetRequest(location) {
  const url = `https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/${location}/?unitGroup=us&key=${apiKey}&contentType=json`;
  let response = await fetch(url, {method: "GET"});
  response = await response.json();
  return response;
}

function temperatureConverter(faren) {
  const cel = ((faren - 32) * 5) / 9;
  return faren + "°F / " + cel.toFixed(1) + "°C";
}

async function buildEmbed(data) {
  const currentConditions = data.currentConditions;
  const embed = new MessageEmbed();
  const currentDate = new Date(currentConditions.datetimeEpoch * 1000);
  embed.setThumbnail("attachment://weather.png");
  embed.setTitle(`${data.resolvedAddress}, ${currentDate.toLocaleDateString("en-US", {timeZone: data.timezone, month: "2-digit", day: "2-digit", hour: "numeric", minute: "numeric"})}\n${currentConditions.conditions}`);
  embed.setDescription(`**${data.description}**\n\n**Current Temperature:** ${temperatureConverter(currentConditions.temp)}\n**Feels Like:** ${temperatureConverter(currentConditions.feelslike)}\n**Humidity:** ${currentConditions.humidity}%\n**Wind:** ${currentConditions.windspeed} mph\n**Sunrise:** ${currentConditions.sunrise}\n **Sunset:** ${currentConditions.sunset}\n**UV Index:** ${currentConditions.uvindex}`);
  const forecast = data.days;
  for (let i = 1; i < forecast.length && i < 7; i++) {
    const date = new Date(forecast[i].datetimeEpoch * 1000);
    embed.addField(date.toLocaleDateString("en-US", {timeZone: data.timezone, weekday: "long"}), `**Min:** ${temperatureConverter(forecast[i].tempmin)}\n**Max** ${temperatureConverter(forecast[i].tempmax)}\n**Percipitation:** ${forecast[i].precipprob}%`, true);
  }
  const alerts = data.alerts;

  if (alerts.length != 0) {
    const alertArray = [];
    for (let i = 0; i < alerts.length; i++) {
      const startTime = new Date(alerts[i].onsetEpoch * 1000);
      const endTime = new Date(alerts[i].endsEpoch * 1000);
      alertArray.push(`[[${startTime.toLocaleDateString("en-US", {timeZone: data.timezone, month: "2-digit", day: "2-digit"}) + " " + startTime.toLocaleTimeString("en-US", {timeZone: data.timezone, hour12: false, hour: "2-digit", minute: "2-digit"})} - ${endTime.toLocaleDateString("en-US", {timeZone: data.timezone, month: "2-digit", day: "2-digit"}) + " " + endTime.toLocaleTimeString("en-US", {timeZone: data.timezone, hour12: false, hour: "2-digit", minute: "2-digit"})}] ${alerts[i].event}](${alerts[i].link})`);
    }
    embed.addField("Alerts", alertArray.join("\n"), false);
  }
  return embed;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("weather")
    .setDescription("What is the weather?")
    .addStringOption((option) => option.setName("location").setDescription("Where").setRequired(true)),
  async execute(client, interaction) {
    const location = interaction.options.getString("location");
    const data = await sendGetRequest(location);
    const embed = await buildEmbed(data);
    interaction.reply({embeds: [embed], files: [{attachment: path.join(__dirname, `../media/VisualCrossingIcons/${data.currentConditions.icon}.png`), name: "weather.png"}]});
    return "N/A";
  },
};
