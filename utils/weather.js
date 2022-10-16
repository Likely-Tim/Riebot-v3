const fetch = require("node-fetch");
const { sendGetRequestGeocoding, sendGetRequestZipCode } = require("./misc");
const { logger } = require("../utils/logger");

const OPEN_WEATHER_KEY = process.env.OPEN_WEATHER_KEY;

async function sendGetRequestWeather(location) {
  let name;
  let lat;
  let long;
  // Check if zip code (only US)
  if (!isNaN(location)) {
    const zip = parseInt(location);
    let response = await sendGetRequestZipCode(zip);
    try {
      name = `${response.results[zip][0].city}, ${response.results[zip][0].state}, US`;
      lat = response.results[zip][0].latitude;
      long = response.results[zip][0].longitude;
    } catch (error) {
      logger.info(`[Weather] ${error}`);
      return null;
    }
  } else {
    let response = await sendGetRequestGeocoding(location);
    try {
      if (response[0].state) {
        name = `${response[0].name}, ${response[0].state}, ${response[0].country}`;
      } else {
        name = `${response[0].name}, ${response[0].country}`;
      }
      lat = response[0].lat;
      long = response[0].lon;
    } catch (error) {
      logger.info(`[Weather] ${error}`);
      return null;
    }
  }
  logger.info(`[Weather] Getting Weather Information from ${lat}, ${long}`);
  const url = `https://api.openweathermap.org/data/3.0/onecall?lat=${lat}&lon=${long}&exclude=minutely,hourly&units=imperial&lang=en&appid=${OPEN_WEATHER_KEY}`;
  let response = await fetch(url, { method: "GET" });
  logger.info(`[Weather] Getting Weather Information Status: ${response.status}`);
  response = await response.json();
  response.name = name;
  return response;
}

module.exports = { sendGetRequestWeather };
