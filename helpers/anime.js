const fetch = require("node-fetch");
const CryptoJS = require("crypto-js");
const Keyv = require('keyv');
const { KeyvFile } = require('keyv-file');

const MALID = process.env['MAL ID'];
const MALSecret = process.env['MAL SECRET'];
const PASSWORD = process.env['PASSWORD'];

const tokens = new Keyv({
  store: new KeyvFile({
    filename: `storage/tokens.json`,
    encode: JSON.stringify,
    decode: JSON.parse
  })
});

function query_create(args) {
  let query = args.join("+");
  return encodeURIComponent(query);
}

async function mal_search(query) {
  query = query_create(query.split(" "));
  let url = `https://api.myanimelist.net/v2/anime?q=${query}&limit=1&nsfw=true`;
  let access_token_encrypted = await tokens.get("mal_access");
  let access_token = CryptoJS.AES.decrypt(access_token_encrypted, PASSWORD).toString(CryptoJS.enc.Utf8);
  let authorization = "Bearer " + access_token;
  let response = await fetch(url, {
      method: 'GET', 
      headers: {"Authorization": authorization}});
  if(response.status == 400) {
    return "No show found!"
  }
  if(response.status == 401) {
    await postRefreshMAL();
    return await sendGetRequest_search(query);
  }
  response = await response.json();
  let id = response.data[0].node.id;
  url = `https://api.myanimelist.net/v2/anime/${id}?fields=synopsis,opening_themes,ending_themes,mean,studio,status,num_episodes,rank,studios`;
  response = await fetch(url, {
      method: 'GET', 
      headers: {"Authorization": authorization}});
  return response.json();
}

async function mal_searchId(id) {
  let url = `https://api.myanimelist.net/v2/anime/${id}?fields=synopsis,opening_themes,ending_themes,mean,studio,status,num_episodes,rank,studios`;
  let access_token_encrypted = await tokens.get("mal_access");
  let access_token = CryptoJS.AES.decrypt(access_token_encrypted, PASSWORD).toString(CryptoJS.enc.Utf8);
  let authorization = "Bearer " + access_token;
  let response = await fetch(url, {
      method: 'GET', 
      headers: {"Authorization": authorization}});
  if(response.status == 401) {
    await postRefreshMAL();
    return await sendGetRequest_searchId(id);
  }
  return response.json();
}

async function anilist_va(query) {
  var search = `
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

    let url = `https://graphql.anilist.co`;
    let response = await fetch(url, {
        method: 'POST', 
        headers: {'Content-Type': 'application/json',
                  'Accept': 'application/json'},
        body: JSON.stringify({
            query: search
        })
    });
    response = await response.json();
    return response.data.Staff;
}

async function anilist_show(query) {
  var search = `
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
    let url = `https://graphql.anilist.co`;
    let response = await fetch(url, {
        method: 'POST', 
        headers: {'Content-Type': 'application/json',
                  'Accept': 'application/json'},
        body: JSON.stringify({
            query: search
        })
    });
    response = await response.json();
    response = response.data.Media;
    if(response == null) {
      return "No show found!";
    } else {
      return response;
    }
}

module.exports.anilist_va = anilist_va;
module.exports.anilist_show = anilist_show;
module.exports.mal_search = mal_search;
module.exports.mal_searchId = mal_searchId;