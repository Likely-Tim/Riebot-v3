const fetch = require("node-fetch");
const { logger } = require("./logger");

async function getUserQuery(accessToken) {
  logger.info(`[Discord] Getting User`);
  const url = "https://discord.com/api/v10/users/@me";
  let response = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  logger.info(`[Discord] Getting User Response Status: ${response.status}`);
  response = await response.json();
  return response;
}

async function getUser(accessToken) {
  const response = await getUserQuery(accessToken);
  return response;
}

module.exports = { getUser };
