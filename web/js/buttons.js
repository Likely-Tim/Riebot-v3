document.getElementById('spotify_button').onclick = function() {
  location.href = 'https://accounts.spotify.com/en/authorize?client_id=ea2c1c3ca31d409db90f288951542b67&response_type=code&redirect_uri=https:%2F%2Friebot-v3.herokuapp.com%2Fauth%2Fspotify&scope=user-read-recently-played%20user-top-read%20user-read-currently-playing%20user-read-playback-state&show_dialog=true';
};
