const fetch = require("node-fetch");
const {logger} = require("./logger");

const MALID = process.env.MAL_ID;
const MALSecret = process.env.MAL_SECRET;

const dbToken = require("../databaseUtils/tokens");

function queryCreate(args) {
  const query = args.join("+");
  return encodeURIComponent(query);
}

async function malRefreshToken() {
  logger.info("[Anime] Refreshing MAL Token");
  const url = "https://myanimelist.net/v1/oauth2/token";
  const refreshToken = await dbToken.get("malRefresh");
  const data = {
    client_id: MALID,
    client_secret: MALSecret,
    grant_type: "refreshToken",
    refreshToken: refreshToken,
  };
  let response = await fetch(url, {
    method: "POST",
    headers: {"Content-Type": "application/x-www-form-urlencoded"},
    body: new URLSearchParams(data),
  });
  logger.info(`[Anime] Refreshing Token Status: ${response.status}`);
  response = await response.json();
  await dbToken.put("malAccess", response.access_token);
  await dbToken.put("malRefresh", response.refresh_token);
}

async function malShowSearch(query) {
  logger.info(`[Anime] Searching for MAL show "${query}"`);
  query = queryCreate(query.split(" "));
  let url = `https://api.myanimelist.net/v2/anime?q=${query}&limit=20&nsfw=true`;
  const accessToken = await dbToken.get("malAccess");
  const authorization = "Bearer " + accessToken;
  let response = await fetch(url, {
    method: "GET",
    headers: {Authorization: authorization},
  });
  logger.info(`[Anime] MAL Show Search Status: ${response.status}`);
  if (response.status == 400) {
    return "No show found!";
  }
  if (response.status == 401) {
    await malRefreshToken();
    return await malShowSearch(query);
  }
  return await response.json();
}

async function malShowId(id) {
  logger.info(`[Anime] Searching for MAL Show ID: ${id}`);
  const url = `https://api.myanimelist.net/v2/anime/${id}?fields=synopsis,opening_themes,ending_themes,mean,studio,status,num_episodes,rank,studios`;
  const accessToken = await dbToken.get("malAccess");
  const authorization = "Bearer " + accessToken;
  const response = await fetch(url, {
    method: "GET",
    headers: {Authorization: authorization},
  });
  logger.info(`[Anime] MAL ID Search Status: ${response.status}`);
  if (response.status == 200) {
    return await response.json();
  } else if (response.status == 401) {
    await malRefreshToken();
    return await malShowId(id);
  } else if (response.status == 404) {
    return null;
  } else {
    throw new Error(`Status: ${response.status}`);
  }
}

async function anilistVa(query) {
  logger.info(`[Anime] Searching for Anilist VA "${query}"`);
  const search = `
    query {
      Staff (search: "${query}") { 
        name {
          full
          native
        }
        image {
          large
        }
        description
        age
        homeTown
        yearsActive
        dateOfBirth {
          year
          month
          day
        }
        siteUrl
        characters (perPage: 10, sort: [ROLE, FAVOURITES_DESC]) {
          edges {
            role
            node {
              image {
                large
              }
              siteUrl
              description
              name {
                full
              }
              id
            }
            media {
              siteUrl
              title {
                romaji
                english
              }
            }
          }
        }
      }
    }
    `;
  const url = "https://graphql.anilist.co";
  let response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      query: search,
    }),
  });
  logger.info(`[Anime] Anilist VA Search Status: ${response.status}`);
  response = await response.json();
  return response.data.Staff;
}

async function anilistAiringTrend(malId, pageNum) {
  logger.info(`[Anime] Searching for Airing Trend | MAL ID: ${malId} | Page: ${pageNum}`);
  const search = `
    query {
      Media(idMal: ${malId}, type: ANIME) {
        title {
          romaji
          english
          native
        }
        trends(sort: [EPISODE_DESC], releasing: true, page: ${pageNum}) {
          nodes {
            date
            averageScore
            episode
          }
        }
      }     
    }
    `;
  const url = "https://graphql.anilist.co";
  let response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      query: search,
    }),
  });
  logger.info(`[Anime] Anilist Airing Trend Response Status: ${response.status}`);
  response = await response.json();
  return response.data.Media;
}

async function anithemeSearchMalId(malId) {
  logger.info(`[Anime] Searching Anithemes for MAL ID: ${malId}`);
  const url = `https://api.animethemes.moe/anime?&include=images,resources,animethemes.song.artists,animethemes.animethemeentries.videos&fields[anime]=name&fields[animetheme]=type&fields[song]=title&fields[artist]=name&fields[animethemeentry]=episodes&fields[video]=link&filter[has]=resources&filter[site]=MyAnimeList&filter[external_id]=${malId}`;
  let response = await fetch(url, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
  });
  logger.info(`[Anime] Anithemes Response Status: ${response.status}`);
  if (response.status == 200) {
    return await response.json();
  } else {
    throw new Error(`Status: ${response.status}`);
  }
}

module.exports.anilistVa = anilistVa;
module.exports.malShowId = malShowId;
module.exports.anithemeSearchMalId = anithemeSearchMalId;
module.exports.anilistAiringTrend = anilistAiringTrend;
module.exports.malShowSearch = malShowSearch;
