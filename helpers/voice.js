const { song_queue_embed_builder, song_current_song_embed_builder, basic_embed_builder } = require('./embed.js');
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

async function link_playlist(link) {
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