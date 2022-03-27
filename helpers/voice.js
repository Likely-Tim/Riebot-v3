const { song_queue_embed_builder, song_current_song_embed_builder, basic_embed_builder } = require('./embed.js');
const { getPlaylist, nextPage, voiceTempPlaylist } = require('./spotify.js');

const SPOTIFY_PLAYLIST_LINK = "https://open.spotify.com/playlist/";
const spotifyPlaylistRegex = /https?:\/\/(?:embed\.|open\.)(?:spotify\.com\/)(?:(album|playlist)\/|\?uri=spotify:playlist:)((\w|-)+)(?:(?=\?)(?:[?&]foo=(\d*)(?=[&#]|$)|(?![?&]foo=)[^#])+)?(?=#|$)/;
var queue = null;

function create_queue(player, channel_id) {
  if(!queue || queue.destroyed) {
    queue = player.createQueue(channel_id, {leaveOnEnd: false, leaveOnStop: false, leaveOnEmpty: true, deafenOnJoin: true});
  }
  return queue;
}

async function join_channel(channel_id) {
  await queue.join(channel_id);
}

async function link_play(link) {
  try {
    await queue.play(link);
    return true;
  } catch(err) {
    console.log(err);
    return false;
  }
}

function get_spotify_id(url) {
  url = new URL(url);
  let path = url.pathname;
  return path.substring(path.lastIndexOf("/") + 1);
}

async function link_playlist(link) {
  if(!spotifyPlaylistRegex.test(link)) {
    return false;
  }
  let spotify_id = get_spotify_id(link);
  let playlist = await getPlaylist(spotify_id);
  if(playlist.tracks.total > 100) {
    let playlists = await voiceTempPlaylist(playlist);
    for(let i = 0; i < playlists.length; i++) {
      let playlist_link = SPOTIFY_PLAYLIST_LINK + playlists[i];
      await queue.playlist(playlist_link);
    }
    return true
  }
  return false;
  try {
    await queue.playlist(link);
    return true;
  } catch(err) {
    console.log(err);
    return false;
  }
}

function get_song_queue() {
  return song_queue_embed_builder(queue.songs);
}

function get_progress_bar() {
  if(queue.isPlaying) {
    return queue.createProgressBar().toString();
  } else {
    return ""
  }
}

function get_current_song() {
  current_song = queue.nowPlaying;
  progress_bar = get_progress_bar();
  return song_current_song_embed_builder(current_song, progress_bar);
}

function skip_song() {
  try {
    current_song = queue.nowPlaying;
    queue.skip();
    let description = `Skipped [${current_song.name}](${current_song.url})`;
    return basic_embed_builder(description);
  } catch(err) {
    console.log(err);
    return basic_embed_builder("Unable to skip.");
  }
}

function shuffle() {
  try {
    queue.shuffle();
    return get_song_queue();
  } catch(err) {
    console.log(err);
    return basic_embed_builder("Unable to shuffle.");
  }
}



module.exports.create_queue = create_queue;
module.exports.join_channel = join_channel;
module.exports.link_play = link_play;
module.exports.get_song_queue = get_song_queue;
module.exports.get_progress_bar = get_progress_bar;
module.exports.get_current_song = get_current_song;
module.exports.skip_song = skip_song;
module.exports.link_playlist = link_playlist;
module.exports.shuffle = shuffle;