const fetch = require("node-fetch");
const { logger } = require("./logger");

async function getAnimeSeasonQuery(page, season, year) {
  const query = `
    query {
      Page(page: ${page}, perPage: 50) {
        pageInfo {
          hasNextPage
        }
        media(type: ANIME, format_in: [TV, TV_SHORT], season: ${season}, seasonYear: ${year}, sort: [POPULARITY_DESC]) {
          title {
            romaji
            english
            native
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

async function getAnimeSeason(season, year) {
  let page = 1;
  let response = await getAnimeSeasonQuery(page, season, year);
  let media = response.data.Page.media;
  while (response.data.Page.pageInfo.hasNextPage) {
    page++;
    response = await getAnimeSeasonQuery(page, season, year);
    media = media.concat(response.data.Page.media);
  }
  return media;
}

module.exports = { getAnimeSeason };
