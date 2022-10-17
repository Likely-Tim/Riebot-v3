const fetch = require("node-fetch");
const { logger } = require("./logger");

async function getAnimeSeasonQuery(page, season, year) {
  logger.info(`[Anilist] Get Anime for ${season} ${year} page ${page}`);
  const query = `
    query {
      Page(page: ${page}, perPage: 50) {
        pageInfo {
          hasNextPage
        }
        media(type: ANIME, format_in: [TV, TV_SHORT], season: ${season}, seasonYear: ${year}, sort: [POPULARITY_DESC]) {
          format
          title {
            romaji
            english
            native
          }
          episodes
          nextAiringEpisode {
            timeUntilAiring
            airingAt
            episode
          }
          airingSchedule {
            pageInfo {
              hasNextPage
            }
            nodes {
              timeUntilAiring
              episode
            }
          }
          coverImage {
            extraLarge
            large
            medium
          }
          siteUrl
          stats {
            statusDistribution {
              status
              amount
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
      query: query,
    }),
  });
  logger.info(`[Anilist] Get Anime Season Response Status: ${response.status}`);
  response = await response.json();
  return response;
}

async function getAnimeAiringQuery(page, startTime, endTime) {
  logger.info(`[Anilist] Get Anime Airing Between ${startTime}-${endTime} page ${page}`);
  const query = `
    query {
      Page(page: ${page}, perPage: 50) {
        pageInfo {
          hasNextPage
        }
        airingSchedules(airingAt_greater: ${startTime}, airingAt_lesser: ${endTime}, sort: [TIME]) {
          media {
            popularity
            format
            title {
              romaji
              english
              native
            }
            nextAiringEpisode {
              timeUntilAiring
              airingAt
              episode
            }
            episodes
            airingSchedule {
              pageInfo {
                hasNextPage
              }
              nodes {
                timeUntilAiring
                episode
              }
            }
            coverImage {
              extraLarge
              large
              medium
            }
            siteUrl
            stats {
              statusDistribution {
                status
                amount
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
      query: query,
    }),
  });
  logger.info(`[Anilist] Get Anime Airing Response Status: ${response.status}`);
  response = await response.json();
  return response;
}

async function getAnimeSeason(season, year) {
  let page = 1;
  let response = await getAnimeSeasonQuery(page, season, year);
  let media = response.data.Page.media;
  while (response.data.Page.pageInfo.hasNextPage) {
    page++;
    response = await getAnimeSeasonQuery(page, season, year);
    media = media.concat(response.data.Page.media);
  }
  return removeDuplicateMedia(media);
}

async function getAnimeAiring(startTime, endTime) {
  let page = 1;
  let response = await getAnimeAiringQuery(page, startTime, endTime);
  const media = [];
  for (let i = 0; i < response.data.Page.airingSchedules.length; i++) {
    media.push(response.data.Page.airingSchedules[i].media);
  }
  while (response.data.Page.pageInfo.hasNextPage) {
    page++;
    response = await getAnimeAiringQuery(page, startTime, endTime);
    for (let i = 0; i < response.data.Page.airingSchedules.length; i++) {
      media.push(response.data.Page.airingSchedules[i].media);
    }
  }
  return removeDuplicateMedia(media);
}

// Anilist API bug may return duplicates
function removeDuplicateMedia(media) {
  return media.filter((value, index, self) => index === self.findIndex((t) => t.siteUrl === value.siteUrl));
}

module.exports = { getAnimeSeason, getAnimeAiring };
