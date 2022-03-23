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
    let song = await queue.play(link);
    return true;
  } catch(err) {
    return false;
  }
}



module.exports.create_queue = create_queue;
module.exports.join_channel = join_channel;
module.exports.link_play = link_play;