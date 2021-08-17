const { SlashCommandBuilder } = require('@discordjs/builders');
const Database = require("@replit/database");
const SPOTID = process.env['SPOTIFY ID'];
const SPOTSECRET = process.env['SPOTIFY SECRET'];
const fetch = require("node-fetch");
const db = new Database();

async function sendPostRequest_refreshToken() {
  let refresh = await db.get("spotify_refresh");
  let url = "https://accounts.spotify.com/api/token";
  let data = {"client_id": SPOTID, "client_secret": SPOTSECRET, "grant_type": "refresh_token", "refresh_token": refresh};
  let response = await fetch(url, {
      method: 'POST', 
      headers: {'Content-Type': 'application/x-www-form-urlencoded'},
      body: new URLSearchParams(data)});
  response = await response.json();
  db.set("spotify_access", response.access_token);
  return;
}

async function sendGetRequest_currentPlaying() {
  let access_token = await db.get("spotify_access");
  let url = `https://api.spotify.com/v1/me/player/currently-playing?market=US`;
  let authorization = "Bearer " + access_token;
  let response = await fetch(url, {
      method: 'GET', 
      headers: {"Authorization": authorization}});
  return await playing_parse(response);
}

async function playing_parse(response) {
  if(response.status === 401) {
    await sendPostRequest_refreshToken();
    let response = await sendGetRequest_currentPlaying();
    return response;
  }
  if(response.status === 204) {
    return "Nothing playing.";
  }
  response = await response.json();
  return response.item.external_urls.spotify
}

module.exports = {
	data: new SlashCommandBuilder()
		.setName('spotify-playing')
		.setDescription('What is currently playing?'),
	async execute(client, interaction) {
    let response = await sendGetRequest_currentPlaying();
		return interaction.reply(response);
	},
};