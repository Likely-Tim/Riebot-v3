/**
 * @module Spotify
 */

const fetch = require("node-fetch");
const CryptoJS = require("crypto-js");

const postgress = require('pg');
const database = new postgress.Client({connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false }});
database.connect();

const PASSWORD = process.env.PASSWORD;
const SPOTID = process.env.SPOTIFY_ID;
const SPOTSECRET = process.env.SPOTIFY_SECRET;

/**
 * Refreshes Stored Spotify Access Token
 * 
 * @returns {Promise<boolean>} Boolean if successful or not
 */
async function refreshToken() {
  const res = await database.query("SELECT * FROM tokens WHERE name = 'spotify_refresh';");
  const refreshTokenEncrypted = res.rows[0].token;
  const refreshToken = CryptoJS.AES.decrypt(refreshTokenEncrypted, PASSWORD).toString(CryptoJS.enc.Utf8);
  const url = "https://accounts.spotify.com/api/token";
  const data = {"client_id": SPOTID, "client_secret": SPOTSECRET, "grant_type": "refresh_token", "refresh_token": refreshToken};
  let response = await fetch(url, {
      method: 'POST', 
      headers: {'Content-Type': 'application/x-www-form-urlencoded'},
      body: new URLSearchParams(data)});
  if(response.status != 200) {
    return false;
  }
  response = await response.json();
  const accessTokenEncrypted = CryptoJS.AES.encrypt(response.access_token, PASSWORD).toString();
  await database.query(`INSERT INTO tokens VALUES ('spotify_access', '${accessTokenEncrypted}') ON CONFLICT (name) DO UPDATE SET token = EXCLUDED.token;`);
  console.log("Refreshed Spotify Creds");
  return true;
}

/**
 * Use Spotify API to Search for Items
 * 
 * @param {string} type - Type to search for (Allowed Values: "album", "artist", "track")
 * @param {string} query - Search Qurty
 * @returns {Promise<object>} Search Response
 */
async function search(type, query) {
  const res = await database.query("SELECT * FROM tokens WHERE name = 'spotify_access';");
  const access_token_encrypted = res.rows[0].token;
  const access_token = CryptoJS.AES.decrypt(access_token_encrypted, PASSWORD).toString(CryptoJS.enc.Utf8);
  const url = `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=${type}&limit=5`;
  const authorization = "Bearer " + access_token;
  const response = await fetch(url, {
      method: 'GET', 
      headers: {"Authorization": authorization}});
  if(response.status == 200) {
    return await response.json();
  } else if(response.status == 401) {
    await refreshToken();
    return await search(type, query);
  } else {
    throw `Spotify Status: ${response.status}`;
  }
}

/**
 * Get the currently playing track
 * 
 * @param {boolean} uri - Want URI or link to track
 * @returns {Promise<string>} URI or link of currently playing track
 */
async function currentlyPlaying(uri) {
  const res = await database.query("SELECT * FROM tokens WHERE name = 'spotify_access';");
  const access_token_encrypted = res.rows[0].token;
  const access_token = CryptoJS.AES.decrypt(access_token_encrypted, PASSWORD).toString(CryptoJS.enc.Utf8);
  const url = `https://api.spotify.com/v1/me/player/currently-playing`;
  const authorization = "Bearer " + access_token;
  let response = await fetch(url, {
      method: 'GET', 
      headers: {"Authorization": authorization}});
  if(response.status == 200) {
    response = await response.json();
    if(response.currently_playing_type == "ad") {
      return "Ad";
    } else if(uri) {
      return response.item.uri;
    } else {
      return response.item.external_urls.spotify;
    }
  } else if(response.status == 204) {
    return "Nothing Playing";
  } else if(response.status == 401) {
    await refreshToken();
    return await currentlyPlaying(uri);
  } else {
    throw `Spotify Status: ${response.status}`;
  }
}

/**
 * Add currently playing track to a Spotify playlist
 * 
 * @param {string} playlistId - Spotify Playlist ID
 * @returns {boolean} Successful or not
 */
async function playlistAddPlaying(playlistId) {
  const uri = await currentlyPlaying(true);
  if(!uri.startsWith("spotify:track:")) {
    return false;
  }
  const res = await database.query("SELECT * FROM tokens WHERE name = 'spotify_access';");
  const access_token_encrypted = res.rows[0].token;
  const access_token = CryptoJS.AES.decrypt(access_token_encrypted, PASSWORD).toString(CryptoJS.enc.Utf8);
  const url = `https://api.spotify.com/v1/playlists/${playlistId}/tracks?uris=${uri}`;
  const authorization = "Bearer " + access_token;
  const response = await fetch(url, {
      method: 'POST', 
      headers: {"Authorization": authorization}});
  if(response.status == 201) {
    return true;
  } else if(response.status == 401) {
    await refreshToken();
    return await playlistAddPlaying(playlistId);
  } else {
    throw `Spotify Status: ${response.status}`;
  }
}

/**
 * Get the top played artist or track in a certain amount of time
 * 
 * @param {string} type - Type to search for (Allowed Values: artist, track)
 * @param {string} period - Time period (Allowed Values: short_term, medium_term, long_term)
 * @returns {Promise<object>} Spotify Results
 */
async function topPlayed(type, period) {
  const res = await database.query("SELECT * FROM tokens WHERE name = 'spotify_access';");
  const access_token_encrypted = res.rows[0].token;
  const access_token = CryptoJS.AES.decrypt(access_token_encrypted, PASSWORD).toString(CryptoJS.enc.Utf8);
  const url = `https://api.spotify.com/v1/me/top/${type}?time_range=${period}&limit=5`;
  const authorization = "Bearer " + access_token;
  const response = await fetch(url, {
      method: 'GET', 
      headers: {"Authorization": authorization}});
  if(response.status == 200) {
    return await response.json();
  } else if(response.status == 401) {
    await refreshToken();
    return await topPlayed(type, period);
  } else {
    throw `Spotify Status: ${response.status}`;
  }
}

/**
 * Get a Spotify playlist by its ID
 * 
 * @param {string} playlistId - Spotify Playlist ID
 * @returns {Promise<object>} Spotify Result
 */
async function getPlaylist(playlistId) {
  const res = await database.query("SELECT * FROM tokens WHERE name = 'spotify_access';");
  const access_token_encrypted = res.rows[0].token;
  const access_token = CryptoJS.AES.decrypt(access_token_encrypted, PASSWORD).toString(CryptoJS.enc.Utf8);
  const url = `https://api.spotify.com/v1/playlists/${playlistId}/`;
  const authorization = "Bearer " + access_token;
  const response = await fetch(url, {
      method: 'GET', 
      headers: {"Authorization": authorization}});
  if(response.status == 200) {
    return await response.json();
  } else if(response.status == 401) {
    await refreshToken();
    return await getPlaylist(playlistId);
  } else {
    throw `Spotify Status: ${response.status}`;
  }
}

/**
 * Get the next page of data
 * 
 * @param {string} url - URL for next page
 * @returns {Promise<object>} Spotify Results
 */
async function nextPage(url) {
  const res = await database.query("SELECT * FROM tokens WHERE name = 'spotify_access';");
  const access_token_encrypted = res.rows[0].token;
  const access_token = CryptoJS.AES.decrypt(access_token_encrypted, PASSWORD).toString(CryptoJS.enc.Utf8);
  const authorization = "Bearer " + access_token;
  const response = await fetch(url, {
      method: 'GET', 
      headers: {"Authorization": authorization}});
  if(response.status == 200) {
    return await response.json();
  } else if(response.status == 401) {
    await refreshToken();
    return await nextPage(url);
  } else {
    throw `Spotify Status: ${response.status}`;
  }
}

/**
 * Create a playlist
 * 
 * @param {string} name - Name of the playlist
 * @param {boolean} isPublic - Playlist is public or not
 * @returns {Promise<object>} Spotify Playlist
 */
async function createPlaylist(name, isPublic) {
  const res = await database.query("SELECT * FROM tokens WHERE name = 'spotify_access';");
  const access_token_encrypted = res.rows[0].token;
  const access_token = CryptoJS.AES.decrypt(access_token_encrypted, PASSWORD).toString(CryptoJS.enc.Utf8);
  const authorization = "Bearer " + access_token;
  const url = "https://api.spotify.com/v1/users/fhusion/playlists";
  const data = {"name": name, "public": isPublic};
  const response = await fetch(url, {
      method: 'POST', 
      headers: {"Authorization": authorization},
      body: JSON.stringify(data)});
  if(response.status == 201) {
    return await response.json();
  } else if(response.status == 401) {
    await refreshToken();
    return await createPlaylist(name, isPublic);
  } else {
    throw `Spotify Status: ${response.status}`;
  }
}

/**
 * Add items to a playlist
 * 
 * @param {string} playlistId - Spotify Playlist ID
 * @param {Array<string>} uriArray - Array of URIs
 * @returns {Promise<boolean>} Successful or not
 */
async function addItemsToPlaylist(playlistId, uriArray) {
  const res = await database.query("SELECT * FROM tokens WHERE name = 'spotify_access';");
  const access_token_encrypted = res.rows[0].token;
  const access_token = CryptoJS.AES.decrypt(access_token_encrypted, PASSWORD).toString(CryptoJS.enc.Utf8);
  const authorization = "Bearer " + access_token;
  const url = `https://api.spotify.com/v1/playlists/${playlistId}/tracks`;
  const data = {"uris": uriArray};
  const response = await fetch(url, {
      method: 'POST', 
      headers: {"Authorization": authorization},
      body: JSON.stringify(data)});
  if(response.status == 201) {
    return true;
  } else if(response.status == 401) {
    await refreshToken();
    return await addItemsToPlaylist(playlistId, uriArray);
  } else {
    throw `Spotify Status: ${response.status}`;
  }
}

/**
 * Unfollow "delete" a playlist
 * 
 * @param {string} playlistId - Spotify Playlist ID
 * @returns {boolean} Successful or not
 */
async function unfollowPlaylist(playlistId) {
  const res = await database.query("SELECT * FROM tokens WHERE name = 'spotify_access';");
  const access_token_encrypted = res.rows[0].token;
  const access_token = CryptoJS.AES.decrypt(access_token_encrypted, PASSWORD).toString(CryptoJS.enc.Utf8);
  const authorization = "Bearer " + access_token;
  const url = `https://api.spotify.com/v1/playlists/${playlistId}/followers`;
  const response = await fetch(url, {
      method: 'DELETE', 
      headers: {"Authorization": authorization}});
  if(response.status == 200) {
    return true;
  } else if(response.status == 401) {
    await refreshToken();
    return await unfollowPlaylist();
  } else {
    throw `Spotify Status: ${response.status}`;
  }
}

/**
 * Create playlists of length 100
 * 
 * @param {object} playlist - Original Spotify Playlist Object
 * @returns {Array<string>} Array of Playlist IDs
 */
async function voiceTempPlaylist(playlist) {
  let tempPlaylistIds = []
  let uriArray = [];
  let tempPlaylist = await createPlaylist("Temp", false);
  let tempPlaylistId = tempPlaylist.id;
  tempPlaylistIds.push(tempPlaylistId);
  for(let i = 0; i < playlist.tracks.items.length; i++) {
    if(playlist.tracks.items[i].is_local) {
      continue;
    }
    uriArray.push(playlist.tracks.items[i].track.uri);
  }
  await addItemsToPlaylist(tempPlaylistId, uriArray);
  uriArray = [];
  playlist = await nextPage(playlist.tracks.next);
  tempPlaylist = await createPlaylist("Temp", false);
  tempPlaylistId = tempPlaylist.id;
  tempPlaylistIds.push(tempPlaylistId);
  for(let i = 0; i < playlist.items.length; i++) {
    if(playlist.items[i].track.is_local) {
      continue;
    }
    uriArray.push(playlist.items[i].track.uri);
  }
  await addItemsToPlaylist(tempPlaylistId, uriArray);
  while(playlist.next != null) {
    uriArray = [];
    playlist = await nextPage(playlist.next);
    tempPlaylist = await createPlaylist("Temp", false);
    tempPlaylistId = tempPlaylist.id;
    tempPlaylistIds.push(tempPlaylistId);
    for(let i = 0; i < playlist.items.length; i++) {
      if(playlist.items[i].is_local) {
        continue;
      }
      uriArray.push(playlist.items[i].track.uri);
    }
    await addItemsToPlaylist(tempPlaylistId, uriArray);
  }
  return tempPlaylistIds;
}

module.exports.search = search;
module.exports.currentlyPlaying = currentlyPlaying;
module.exports.topPlayed = topPlayed;
module.exports.playlistAddPlaying = playlistAddPlaying;
module.exports.getPlaylist = getPlaylist;
module.exports.voiceTempPlaylist = voiceTempPlaylist;
module.exports.unfollowPlaylist = unfollowPlaylist;

