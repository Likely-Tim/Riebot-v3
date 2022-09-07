const fetch = require("node-fetch");

const MALID = process.env.MAL_ID;
const MALSecret = process.env.MAL_SECRET;

const dbToken = require("../databaseHelpers/tokens.js");

function queryCreate(args) {
  const query = args.join("+");
  return encodeURIComponent(query);
}

async function malRefreshToken() {
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
  response = await response.json();
  await dbToken.put("malAccess", response.access_token);
  await dbToken.put("malRefresh", response.refresh_token);
}

async function malShow(query) {
  query = queryCreate(query.split(" "));
  let url = `https://api.myanimelist.net/v2/anime?q=${query}&limit=1&nsfw=true`;
  const accessToken = await dbToken.get("malAccess");
  const authorization = "Bearer " + accessToken;
  let response = await fetch(url, {
    method: "GET",
    headers: {Authorization: authorization},
  });
  if (response.status == 400) {
    return "No show found!";
  }
  if (response.status == 401) {
    await malRefreshToken();
    return await malShow(query);
  }
  response = await response.json();
  const id = response.data[0].node.id;
  url = `https://api.myanimelist.net/v2/anime/${id}?fields=synopsis,opening_themes,ending_themes,mean,studio,status,num_episodes,rank,studios`;
  response = await fetch(url, {
    method: "GET",
    headers: {Authorization: authorization},
  });
  return response.json();
}

async function malShowId(id) {
  const url = `https://api.myanimelist.net/v2/anime/${id}?fields=synopsis,opening_themes,ending_themes,mean,studio,status,num_episodes,rank,studios`;
  const accessToken = await dbToken.get("malAccess");
  const authorization = "Bearer " + accessToken;
  const response = await fetch(url, {
    method: "GET",
    headers: {Authorization: authorization},
  });
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
  response = await response.json();
  return response.data.Staff;
}

async function anilistShow(query) {
  const search = `
    query {
      Media (search: "${query}", type: ANIME, sort: [FORMAT, SEARCH_MATCH]) { 
        idMal
        title {
          romaji
          english
        }
        description
        episodes
        meanScore
        rankings {
          rank
          allTime
          type
        }
        status
        siteUrl
        trailer {
          id
          site
        }
        coverImage {
          extraLarge
        }
        studios {
          nodes {
            name
            isAnimationStudio
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
  response = await response.json();
  return response.data.Media;
}

async function anilistAiringTrend(malId) {
  const search = `
    query {
      Media(idMal: ${malId}, type: ANIME) {
        title {
          romaji
          english
          native
        }
        trends(sort: [EPISODE_DESC], releasing: true) {
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
  response = await response.json();
  return response.data.Media;
}

async function anithemeSearchMalId(malId) {
  const url = `https://api.animethemes.moe/anime?&include=images,resources,animethemes.song.artists,animethemes.animethemeentries.videos&fields[anime]=name&fields[animetheme]=type&fields[song]=title&fields[artist]=name&fields[animethemeentry]=episodes&fields[video]=link&filter[has]=resources&filter[site]=MyAnimeList&filter[external_id]=${malId}`;
  let response = await fetch(url, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
  });
  if (response.status == 200) {
    return await response.json();
  } else {
    throw new Error(`Status: ${response.status}`);
  }
}

module.exports.anilistVa = anilistVa;
module.exports.anilistShow = anilistShow;
module.exports.malShow = malShow;
module.exports.malShowId = malShowId;
module.exports.anithemeSearchMalId = anithemeSearchMalId;
module.exports.anilistAiringTrend = anilistAiringTrend;
