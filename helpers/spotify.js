const fetch = require("node-fetch");
const Keyv = require('keyv');
const { KeyvFile } = require('keyv-file');
const CryptoJS = require("crypto-js");

const PASSWORD = process.env.PASSWORD;
const SPOTID = process.env.SPOTIFY_ID;
const SPOTSECRET = process.env.SPOTIFY_SECRET;

const tokens = new Keyv({
  store: new KeyvFile({
    filename: `storage/tokens.json`,
    encode: JSON.stringify,
    decode: JSON.parse
  })
});

async function refreshToken() {
  let refresh_token_encrypted = await tokens.get("spotify_refresh");
  let refresh_token = CryptoJS.AES.decrypt(refresh_token_encrypted, PASSWORD).toString(CryptoJS.enc.Utf8);
  let url = "https://accounts.spotify.com/api/token";
  let data = {"client_id": SPOTID, "client_secret": SPOTSECRET, "grant_type": "refresh_token", "refresh_token": refresh_token};
  let response = await fetch(url, {
      method: 'POST', 
      headers: {'Content-Type': 'application/x-www-form-urlencoded'},
      body: new URLSearchParams(data)});
  response = await response.json();
  let access_token_encrypted = CryptoJS.AES.encrypt(response.access_token, PASSWORD).toString();
  await tokens.set("spotify_access", access_token_encrypted);
  console.log("Refreshed Spotify Creds");
  return;
}

async function search(type, query) {
  query = encodeURIComponent(query);
  let access_token_encrypted = await tokens.get("spotify_access");
  let access_token = CryptoJS.AES.decrypt(access_token_encrypted, PASSWORD).toString(CryptoJS.enc.Utf8);
  let url = `https://api.spotify.com/v1/search?q=${query}&type=${type}&market=JP&limit=5`;
  let authorization = "Bearer " + access_token;
  let response = await fetch(url, {
      method: 'GET', 
      headers: {"Authorization": authorization}});
  console.log(response)
  if(response.status == 401) {
    await refreshToken();
    return await search(type, query);
  }
  return await response.json();
}

async function currentlyPlaying() {
  let access_token_encrypted = await tokens.get("spotify_access");
  let access_token = CryptoJS.AES.decrypt(access_token_encrypted, PASSWORD).toString(CryptoJS.enc.Utf8);
  let url = `https://api.spotify.com/v1/me/player/currently-playing?market=US`;
  let authorization = "Bearer " + access_token;
  let response = await fetch(url, {
      method: 'GET', 
      headers: {"Authorization": authorization}});
  if(response.status == 401) {
    await refreshToken();
    return await currentlyPlaying();
  }
  if(response.status == 204) {
    return "Nothing Playing.";
  }
  response = await response.json();
  if(response.currently_playing_type == "ad") {
    return "Ad";
  }
  return response.item.external_urls.spotify;
}

async function currentlyPlaying_uri(token) {
  let url = `https://api.spotify.com/v1/me/player/currently-playing?market=US`;
  let authorization = "Bearer " + token;
  let response = await fetch(url, {
      method: 'GET', 
      headers: {"Authorization": authorization}});
  if(response.status == 401) {
    return "Expired";
  }
  if(response.status == 204) {
    return "Nothing Playing.";
  }
  response = await response.json();
  if(response.currently_playing_type == "ad") {
    return "Ad";
  }
  return response.item.uri;
}

async function playlist_add_playing() {
  let access_token_encrypted = await tokens.get("spotify_access");
  let access_token = CryptoJS.AES.decrypt(access_token_encrypted, PASSWORD).toString(CryptoJS.enc.Utf8);
  let uri = await currentlyPlaying_uri(access_token);
  if(uri == "Expired") {
    await refreshToken();
    return await playlist_add_playing();
  }
  if(!uri.startsWith("spotify:track:")) {
    return false;
  }
  let url = `https://api.spotify.com/v1/playlists/4f0u6dEIdEAefLS9oiM8j0/tracks?uris=${uri}`;
  let authorization = "Bearer " + access_token;
  let response = await fetch(url, {
      method: 'POST', 
      headers: {"Authorization": authorization}});
  if(response.status == 401) {
    await refreshToken();
    return await playlist_add_playing();
  }
  return true;
}

async function topPlayed(type, time) {
  let access_token_encrypted = await tokens.get("spotify_access");
  let access_token = CryptoJS.AES.decrypt(access_token_encrypted, PASSWORD).toString(CryptoJS.enc.Utf8);
  let url = `https://api.spotify.com/v1/me/top/${type}?time_range=${time}&limit=5`;
  let authorization = "Bearer " + access_token;
  let response = await fetch(url, {
      method: 'GET', 
      headers: {"Authorization": authorization}});
  if(response.status == 401) {
    await refreshToken();
    return await topPlayed(type, time);
  }
  return await response.json();
}

async function getPlaylist(playlistId) {
  let access_token_encrypted = await tokens.get("spotify_access");
  let access_token = CryptoJS.AES.decrypt(access_token_encrypted, PASSWORD).toString(CryptoJS.enc.Utf8);
  let url = `https://api.spotify.com/v1/playlists/${playlistId}/`;
  let authorization = "Bearer " + access_token;
  let response = await fetch(url, {
      method: 'GET', 
      headers: {"Authorization": authorization}});
  if(response.status == 401) {
    await refreshToken();
    return await getPlaylist(playlistId);
  }
  return await response.json();
}

async function nextPage(url) {
  let access_token_encrypted = await tokens.get("spotify_access");
  let access_token = CryptoJS.AES.decrypt(access_token_encrypted, PASSWORD).toString(CryptoJS.enc.Utf8);
  let authorization = "Bearer " + access_token;
  let response = await fetch(url, {
      method: 'GET', 
      headers: {"Authorization": authorization}});
  if(response.status == 401) {
    await refreshToken();
    return await getPlaylist(playlistId, offset);
  }
  return await response.json();
}

async function createPlaylist(name, public) {
  let access_token_encrypted = await tokens.get("spotify_access");
  let access_token = CryptoJS.AES.decrypt(access_token_encrypted, PASSWORD).toString(CryptoJS.enc.Utf8);
  let authorization = "Bearer " + access_token;
  let url = "https://api.spotify.com/v1/users/fhusion/playlists";
  let data = {"name": name, "public": public};
  let response = await fetch(url, {
      method: 'POST', 
      headers: {"Authorization": authorization},
      body: JSON.stringify(data)});
  if(response.status == 401) {
    await refreshToken();
    return await createPlaylist();
  }
  return await response.json();
}

async function addItemsToPlaylist(playlistId, uriArray) {
  let access_token_encrypted = await tokens.get("spotify_access");
  let access_token = CryptoJS.AES.decrypt(access_token_encrypted, PASSWORD).toString(CryptoJS.enc.Utf8);
  let authorization = "Bearer " + access_token;
  let url = `https://api.spotify.com/v1/playlists/${playlistId}/tracks`;
  let data = {"uris": uriArray};
  let response = await fetch(url, {
      method: 'POST', 
      headers: {"Authorization": authorization},
      body: JSON.stringify(data)});
  if(response.status == 401) {
    await refreshToken();
    return await addItemsToPlaylist();
  }
  return await response.json();
}

async function voiceTempPlaylist(playlist) {
  let tempPlaylistIds = []
  let uriArray = [];
  let tempPlaylist = await createPlaylist("Temp", false);
  let tempPlaylistId = tempPlaylist.id;
  tempPlaylistIds.push(tempPlaylistId);
  for(let i = 0; i < playlist.tracks.items.length; i++) {
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
    playlist = await nextPage(playlist.tracks.next);
    tempPlaylist = await createPlaylist("Temp", false);
    tempPlaylistId = tempPlaylist.id;
    tempPlaylistIds.push(tempPlaylistId);
    for(let i = 0; i < playlist.items.length; i++) {
      uriArray.push(playlist.items[i].track.uri);
    }
    await addItemsToPlaylist(tempPlaylistId, uriArray);
  }
  return tempPlaylistIds;
}

module.exports.search = search;
module.exports.currentlyPlaying = currentlyPlaying;
module.exports.topPlayed = topPlayed;
module.exports.playlist_add_playing = playlist_add_playing;
module.exports.getPlaylist = getPlaylist;
module.exports.nextPage = nextPage;
module.exports.voiceTempPlaylist = voiceTempPlaylist;

