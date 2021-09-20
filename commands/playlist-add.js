const { SlashCommandBuilder } = require('@discordjs/builders');
/*
async function sendGetRequest_search(type, query) {
  let access_token = await replit_db.get("spotify_access");
  let url = `https://api.spotify.com/v1/search?q=${query}&type=${type}&market=JP&limit=5`;
  let authorization = "Bearer " + access_token;
  let response = await fetch(url, {
      method: 'GET', 
      headers: {"Authorization": authorization}});
  response = await response.json();
  if(response.error !== undefined && response.error.status === 401) {
    await sendPostRequest_refreshToken();
    return await sendGetRequest_search(type, query);
  }
  return await response_parse(response, type);
}
*/

module.exports = {
	data: new SlashCommandBuilder()
		.setName('playlist-add')
		.setDescription('Replies with Pong!'),
	async execute(client, interaction) {
		interaction.reply('Pong!');
    return "N/A";
	},
};