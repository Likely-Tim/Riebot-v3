const fetch = require('node-fetch');
const CryptoJS = require('crypto-js');
const Keyv = require('keyv');
const {KeyvFile} = require('keyv-file');

const MALID = process.env.MAL_ID;
const MALSecret = process.env.MAL_SECRET;
const PASSWORD = process.env.PASSWORD;

const tokens = new Keyv({
  store: new KeyvFile({
    filename: 'storage/tokens.json',
    encode: JSON.stringify,
    decode: JSON.parse,
  }),
});

function queryCreate(args) {
  const query = args.join('+');
  return encodeURIComponent(query);
}

async function postRefreshMAL() {
  const url = 'https://myanimelist.net/v1/oauth2/token';
  let refreshTokenEncrypted = await tokens.get('mal_refresh');
  const refreshToken = CryptoJS.AES.decrypt(refreshTokenEncrypted, PASSWORD).toString(CryptoJS.enc.Utf8);
  const data = {client_id: MALID, client_secret: MALSecret, grant_type: 'refreshToken', refreshToken};
  let response = await fetch(url, {
    method: 'POST',
    headers: {'Content-Type': 'application/x-www-form-urlencoded'},
    body: new URLSearchParams(data),
  });
  response = await response.json();
  const accessTokenEncrypted = CryptoJS.AES.encrypt(response.accessToken, PASSWORD).toString();
  await tokens.set('mal_access', accessTokenEncrypted);
  refreshTokenEncrypted = CryptoJS.AES.encrypt(response.refreshToken, PASSWORD).toString();
  await tokens.set('mal_refresh', refreshTokenEncrypted);
}

async function malSearch(query) {
  query = queryCreate(query.split(' '));
  let url = `https://api.myanimelist.net/v2/anime?q=${query}&limit=1&nsfw=true`;
  const accessTokenEncrypted = await tokens.get('mal_access');
  const accessToken = CryptoJS.AES.decrypt(accessTokenEncrypted, PASSWORD).toString(CryptoJS.enc.Utf8);
  const authorization = 'Bearer ' + accessToken;
  let response = await fetch(url, {
    method: 'GET',
    headers: {Authorization: authorization},
  });
  if (response.status == 400) {
    return 'No show found!';
  }
  if (response.status == 401) {
    await postRefreshMAL();
    return await malSearch(query);
  }
  response = await response.json();
  const id = response.data[0].node.id;
  url = `https://api.myanimelist.net/v2/anime/${id}?fields=synopsis,openingThemes,endingThemes,mean,studio,status,num_episodes,rank,studios`;
  response = await fetch(url, {
    method: 'GET',
    headers: {Authorization: authorization},
  });
  return response.json();
}

async function malSearchId(id) {
  const url = `https://api.myanimelist.net/v2/anime/${id}?fields=synopsis,openingThemes,endingThemes,mean,studio,status,num_episodes,rank,studios`;
  const accessTokenEncrypted = await tokens.get('mal_access');
  const accessToken = CryptoJS.AES.decrypt(accessTokenEncrypted, PASSWORD).toString(CryptoJS.enc.Utf8);
  const authorization = 'Bearer ' + accessToken;
  const response = await fetch(url, {
    method: 'GET',
    headers: {Authorization: authorization},
  });
  if (response.status == 401) {
    await postRefreshMAL();
    return await malSearchId(id);
  }
  return response.json();
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

  const url = 'https://graphql.anilist.co';
  let response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
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
  const url = 'https://graphql.anilist.co';
  let response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({
      query: search,
    }),
  });
  response = await response.json();
  response = response.data.Media;
  if (response == null) {
    return 'No show found!';
  } else {
    return response;
  }
}

module.exports.anilistVa = anilistVa;
module.exports.anilistShow = anilistShow;
module.exports.malSearch = malSearch;
module.exports.malSearchId = malSearchId;
