const fetch = require("node-fetch");

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