const Keyv = require('keyv');
const { KeyvFile } = require('keyv-file');
const fetch = require("node-fetch");
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
  console.log("Refreshing");
  let refresh_token_encrypted = await tokens.get("spotify_refresh");
  let refresh_token = CryptoJS.AES.decrypt(refresh_token_encrypted, PASSWORD).toString(CryptoJS.enc.Utf8);
  let url = "https://accounts.spotify.com/api/token";
  let data = {"client_id": SPOTID, "client_secret": SPOTSECRET, "grant_type": "refresh_token", "refresh_token": refresh_token};
  let response = await fetch(url, {
      method: 'POST', 
      headers: {'Content-Type': 'application/x-www-form-urlencoded'},
      body: new URLSearchParams(data)});
  response = await response.json();
  console.log(response);
  let access_token_encrypted = CryptoJS.AES.encrypt(response.access_token, PASSWORD).toString();
  await tokens.set("spotify_access", access_token_encrypted);
  console.log("Refreshing Done");
  return;
}

async function search(type, query) {
  let access_token_encrypted = await tokens.get("spotify_access");
  let access_token = CryptoJS.AES.decrypt(access_token_encrypted, PASSWORD).toString(CryptoJS.enc.Utf8);
  let url = `https://api.spotify.com/v1/search?q=${query}&type=${type}&market=JP&limit=5`;
  let authorization = "Bearer " + access_token;
  let response = await fetch(url, {
      method: 'GET', 
      headers: {"Authorization": authorization}});
  if(response.status == 401) {
    console.log("401");
    response = await response.json();
    await refreshToken();
    console.log("Done");
    let result = await search(type, query);
    return result;
  }
  return await response.json();
}

module.exports.search = search;


