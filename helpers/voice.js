const {songQueueEmbedBuilder, songCurrentSongEmbedBuilder, basicEmbedBuilder} = require('./embed.js');
const {getPlaylist, voiceTempPlaylist, unfollowPlaylist} = require('./spotify.js');

const SPOTIFY_PLAYLIST_LINK = 'https://open.spotify.com/playlist/';
const spotifyPlaylistRegex = /https?:\/\/(?:embed\.|open\.)(?:spotify\.com\/)(?:(album|playlist)\/|\?uri=spotify:playlist:)((\w|-)+)(?:(?=\?)(?:[?&]foo=(\d*)(?=[&#]|$)|(?![?&]foo=)[^#])+)?(?=#|$)/;
let queue = null;

function createQueue(player, channelId) {
  if (!queue || queue.destroyed) {
    queue = player.createQueue(channelId, {leaveOnEnd: false, leaveOnStop: false, leaveOnEmpty: true, deafenOnJoin: true});
  }
  return queue;
}

async function joinChannel(channelId) {
  await queue.join(channelId);
}

async function linkPlay(link) {
  try {
    await queue.play(link);
    return true;
  } catch (err) {
    console.log(err);
    return false;
  }
}

function getSpotifyId(url) {
  url = new URL(url);
  const path = url.pathname;
  return path.substring(path.lastIndexOf('/') + 1);
}

async function linkPlaylist(link) {
  if (!spotifyPlaylistRegex.test(link)) {
    return false;
  }
  const spotifyId = getSpotifyId(link);
  const playlist = await getPlaylist(spotifyId);
  if (playlist.tracks.total > 100) {
    const playlists = await voiceTempPlaylist(playlist);
    for (let i = 0; i < playlists.length; i++) {
      const playlistLink = SPOTIFY_PLAYLIST_LINK + playlists[i];
      try {
        await queue.playlist(playlistLink);
      } catch (err) {
        console.log('Some Playlist Error');
      }
      await unfollowPlaylist(playlists[i]);
    }
    return true;
  }
  try {
    await queue.playlist(link);
    return true;
  } catch (err) {
    console.log(err);
    return false;
  }
}

function getSongQueue() {
  return songQueueEmbedBuilder(queue.songs);
}

function getProgressBar() {
  if (queue.isPlaying) {
    return queue.createProgressBar().toString();
  } else {
    return '';
  }
}

function getCurrentSong() {
  const currentSong = queue.nowPlaying;
  const progressBar = getProgressBar();
  return songCurrentSongEmbedBuilder(currentSong, progressBar);
}

function skipSong() {
  try {
    const currentSong = queue.nowPlaying;
    queue.skip();
    const description = `Skipped [${currentSong.name}](${currentSong.url})`;
    return basicEmbedBuilder(description);
  } catch (err) {
    console.log(err);
    return basicEmbedBuilder('Unable to skip.');
  }
}

function shuffle() {
  try {
    queue.shuffle();
    return getSongQueue();
  } catch (err) {
    console.log(err);
    return basicEmbedBuilder('Unable to shuffle.');
  }
}

module.exports.createQueue = createQueue;
module.exports.joinChannel = joinChannel;
module.exports.linkPlay = linkPlay;
module.exports.getSongQueue = getSongQueue;
module.exports.getProgressBar = getProgressBar;
module.exports.getCurrentSong = getCurrentSong;
module.exports.skipSong = skipSong;
module.exports.linkPlaylist = linkPlaylist;
module.exports.shuffle = shuffle;
