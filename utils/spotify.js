/**
 * @module Spotify
 */

const fetch = require("node-fetch");
const {logger} = require("./logger");

const dbToken = require("../databaseUtils/tokens");

const SPOTIFY_ID = process.env.SPOTIFY_ID;
const SPOTIFY_SECRET = process.env.SPOTIFY_SECRET;

/**
 * Refreshes Stored Spotify Access Token
 *
 * @return {Promise<boolean>} Boolean if successful or not
 */
async function refreshToken() {
  logger.info(`[Spotify] Refreshing Token`);
  const refreshToken = await dbToken.get("spotifyRefresh");
  const url = "https://accounts.spotify.com/api/token";
  const data = {
    client_id: SPOTIFY_ID,
    client_secret: SPOTIFY_SECRET,
    grant_type: "refresh_token",
    refresh_token: refreshToken,
  };
  let response = await fetch(url, {
    method: "POST",
    headers: {"Content-Type": "application/x-www-form-urlencoded"},
    body: new URLSearchParams(data),
  });
  logger.info(`[Spotify] Refreshing Token Status: ${response.status}`);
  if (response.status != 200) {
    return false;
  }
  response = await response.json();
  await dbToken.put("spotifyAccess", response.access_token);
  return true;
}

/**
 * Use Spotify API to Search for Items
 *
 * @param {string} type - Type to search for (Allowed Values: "album", "artist", "track")
 * @param {string} query - Search Query
 * @return {Promise<object>} Search Response
 */
async function search(type, query) {
  logger.info(`[Spotify] Searching for "${query}" ${type}`);
  const accessToken = await dbToken.get("spotifyAccess");
  const url = `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=${type}&limit=5`;
  const authorization = "Bearer " + accessToken;
  const response = await fetch(url, {
    method: "GET",
    headers: {Authorization: authorization},
  });
  logger.info(`[Spotify] Search Status: ${response.status}`);
  if (response.status == 200) {
    return await response.json();
  } else if (response.status == 401) {
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
 * @return {Promise<string>} URI or link of currently playing track
 */
async function currentlyPlaying(uri) {
  logger.info(`[Spotify] Getting playing track | URI: ${uri}`);
  const accessToken = await dbToken.get("spotifyAccess");
  const url = "https://api.spotify.com/v1/me/player/currently-playing";
  const authorization = "Bearer " + accessToken;
  let response = await fetch(url, {
    method: "GET",
    headers: {Authorization: authorization},
  });
  logger.info(`[Spotify] Playing Track Status: ${response.status}`);
  if (response.status == 200) {
    response = await response.json();
    if (response.currently_playing_type == "ad") {
      return "Ad";
    } else if (uri) {
      return response.item.uri;
    } else {
      return response.item.external_urls.spotify;
    }
  } else if (response.status == 204) {
    return "Nothing Playing";
  } else if (response.status == 401) {
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
 * @return {boolean} Successful or not
 */
async function playlistAddPlaying(playlistId) {
  logger.info(`[Spotify] Adding playing track to ${playlistId}`);
  const uri = await currentlyPlaying(true);
  if (!uri.startsWith("spotify:track:")) {
    return false;
  }
  const accessToken = await dbToken.get("spotifyAccess");
  const url = `https://api.spotify.com/v1/playlists/${playlistId}/tracks?uris=${uri}`;
  const authorization = "Bearer " + accessToken;
  const response = await fetch(url, {
    method: "POST",
    headers: {Authorization: authorization},
  });
  logger.info(`[Spotify] Adding Playing Track Status: ${response.status}`);
  if (response.status == 201) {
    return true;
  } else if (response.status == 401) {
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
 * @return {Promise<object>} Spotify Results
 */
async function topPlayed(type, period) {
  logger.info(`[Spotify] Getting top played ${type} for ${period}`);
  const accessToken = await dbToken.get("spotifyAccess");
  const url = `https://api.spotify.com/v1/me/top/${type}?time_range=${period}&limit=5`;
  const authorization = "Bearer " + accessToken;
  const response = await fetch(url, {
    method: "GET",
    headers: {Authorization: authorization},
  });
  logger.info(`[Spotify] Getting Top Played Status: ${response.status}`);
  if (response.status == 200) {
    return await response.json();
  } else if (response.status == 401) {
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
 * @return {Promise<object>} Spotify Result
 */
async function getPlaylist(playlistId) {
  logger.info(`[Spotify] Getting Playlist ${playlistId}`);
  const accessToken = await dbToken.get("spotifyAccess");
  const url = `https://api.spotify.com/v1/playlists/${playlistId}/`;
  const authorization = "Bearer " + accessToken;
  const response = await fetch(url, {
    method: "GET",
    headers: {Authorization: authorization},
  });
  logger.info(`[Spotify] Getting Playlist Status: ${response.status}`);
  if (response.status == 200) {
    return await response.json();
  } else if (response.status == 401) {
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
 * @return {Promise<object>} Spotify Results
 */
async function nextPage(url) {
  logger.info(`[Spotify] Getting next page of data from ${url}`);
  const accessToken = await dbToken.get("spotifyAccess");
  const authorization = "Bearer " + accessToken;
  const response = await fetch(url, {
    method: "GET",
    headers: {Authorization: authorization},
  });
  logger.info(`[Spotify] Next Page Status: ${response.status}`);
  if (response.status == 200) {
    return await response.json();
  } else if (response.status == 401) {
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
 * @return {Promise<object>} Spotify Playlist
 */
async function createPlaylist(name, isPublic) {
  logger.info(`[Spotify] Creating Playlist called ${name} | Public: ${isPublic}`);
  const accessToken = await dbToken.get("spotifyAccess");
  const authorization = "Bearer " + accessToken;
  const url = "https://api.spotify.com/v1/users/fhusion/playlists";
  const data = {name, public: isPublic};
  const response = await fetch(url, {
    method: "POST",
    headers: {Authorization: authorization},
    body: JSON.stringify(data),
  });
  logger.info(`[Spotify] Playlist Creatioin Status: ${response.status}`);
  if (response.status == 201) {
    return await response.json();
  } else if (response.status == 401) {
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
 * @return {Promise<boolean>} Successful or not
 */
async function addItemsToPlaylist(playlistId, uriArray) {
  logger.info(`[Spotify] Adding uris ${uriArray} to playlist ${playlistId}`);
  const accessToken = await dbToken.get("spotifyAccess");
  const authorization = "Bearer " + accessToken;
  const url = `https://api.spotify.com/v1/playlists/${playlistId}/tracks`;
  const data = {uris: uriArray};
  const response = await fetch(url, {
    method: "POST",
    headers: {Authorization: authorization},
    body: JSON.stringify(data),
  });
  logger.info(`[Spotify] Adding Status: ${response.status}`);
  if (response.status == 201) {
    return true;
  } else if (response.status == 401) {
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
 * @return {boolean} Successful or not
 */
async function unfollowPlaylist(playlistId) {
  logger.info(`[Spotify] Deleting Playlist ${playlistId}`);
  const accessToken = await dbToken.get("spotifyAccess");
  const authorization = "Bearer " + accessToken;
  const url = `https://api.spotify.com/v1/playlists/${playlistId}/followers`;
  const response = await fetch(url, {
    method: "DELETE",
    headers: {Authorization: authorization},
  });
  logger.info(`[Spotify] Deleting Playlist Status: ${response.status}`);
  if (response.status == 200) {
    return true;
  } else if (response.status == 401) {
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
 * @return {Array<string>} Array of Playlist IDs
 */
async function voiceTempPlaylist(playlist) {
  logger.info(`[Spotify] Creating a temporary playlist`);
  const tempPlaylistIds = [];
  let uriArray = [];
  let tempPlaylist = await createPlaylist("Temp", false);
  let tempPlaylistId = tempPlaylist.id;
  tempPlaylistIds.push(tempPlaylistId);
  for (let i = 0; i < playlist.tracks.items.length; i++) {
    if (playlist.tracks.items[i].is_local) {
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
  for (let i = 0; i < playlist.items.length; i++) {
    if (playlist.items[i].track.is_local) {
      continue;
    }
    uriArray.push(playlist.items[i].track.uri);
  }
  await addItemsToPlaylist(tempPlaylistId, uriArray);
  while (playlist.next != null) {
    uriArray = [];
    playlist = await nextPage(playlist.next);
    tempPlaylist = await createPlaylist("Temp", false);
    tempPlaylistId = tempPlaylist.id;
    tempPlaylistIds.push(tempPlaylistId);
    for (let i = 0; i < playlist.items.length; i++) {
      if (playlist.items[i].is_local) {
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
