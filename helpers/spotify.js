const fetch = require("node-fetch");
const Keyv = require('keyv');
const { KeyvFile } = require('keyv-file');
const CryptoJS = require("crypto-js");

const PASSWORD = process.env['PASSWORD'];
const SPOTID = process.env['SPOTIFY ID'];
const SPOTSECRET = process.env['SPOTIFY SECRET'];

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

module.exports.search = search;
module.exports.currentlyPlaying = currentlyPlaying;
module.exports.topPlayed = topPlayed;


