const fetch = require("node-fetch");
const {logger} = require("./logger");

async function search(query) {
  logger.info(`[Youtube] Searching for "${query}"`);
  query = encodeURIComponent(query);
  const url = `https://youtube.googleapis.com/youtube/v3/search?part=snippet&q=${query}&safeSearch=none&type=video&maxResults=5&order=viewCount&key=${process.env.YOUTUBE_KEY}`;
  let response = await fetch(url, {
    method: "GET",
    headers: {"Content-Type": "application/json"},
  });
  logger.info(`[Youtube] Search Status: ${response.status}`);
  response = await response.json();
  if (response.pageInfo.totalResults == 0) {
    return "Nothing Found";
  }
  const id = response.items[0].id.videoId;
  return `https://youtu.be/${id}`;
}

module.exports.search = search;
