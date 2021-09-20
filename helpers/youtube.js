const fetch = require("node-fetch");
const Keyv = require('keyv');
const { KeyvFile } = require('keyv-file');
const CryptoJS = require("crypto-js");

const PASSWORD = process.env['PASSWORD'];

const tokens = new Keyv({
  store: new KeyvFile({
    filename: `storage/tokens.json`,
    encode: JSON.stringify,
    decode: JSON.parse
  })
});

async function search(query) {
  query = encodeURIComponent(query);
  let api_key_encrypted = await tokens.get("youtube_key");
  let api_key = CryptoJS.AES.decrypt(api_key_encrypted, PASSWORD).toString(CryptoJS.enc.Utf8);
  let url = `https://youtube.googleapis.com/youtube/v3/search?part=snippet&q=${query}&safeSearch=none&type=video&maxResults=5&order=viewCount&key=${api_key}`;
  let response = await fetch(url, {
      method: 'GET', 
      headers: {'Content-Type': 'application/json'}});
  response = await response.json();
  if(response.pageInfo.totalResults == 0) {
    return "Nothing Found";
  }
  let id = response.items[0].id.videoId;
  return `https://youtu.be/${id}`;
  
}

module.exports.search = search;