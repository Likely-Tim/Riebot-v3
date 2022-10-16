let CronJob = require("cron").CronJob;
const { sendGetRequestWeather } = require("../utils/weather");
const { weatherEmbedBuilder } = require("../utils/embed");
const { logger } = require("../utils/logger.js");

const DISCORD_DEFAULT_CHANNEL = process.env.DISCORD_DEFAULT_CHANNEL;

function cronJobs(client) {
  let job = new CronJob(
    "0 0 8 * * *",
    function () {
      dailyWeather(client);
    },
    null,
    true,
    "America/Los_Angeles"
  );
}

async function dailyWeather(client) {
  logger.info("[Cron] Daily Weather");
  const channel = await client.channels.fetch(DISCORD_DEFAULT_CHANNEL);
  const response = await sendGetRequestWeather("Fremont");
  if (response) {
    const embed = weatherEmbedBuilder(response);
    channel.send({ embeds: [embed] });
  } else {
    const embed = basicEmbedBuilder(`Could not find "Fremont"`);
    channel.send({ embeds: [embed] });
  }
}

module.exports = { cronJobs };
