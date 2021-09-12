sendGetRequest("/spotify_data")
.then(data => {
  generate_iframe(data);
});

async function sendGetRequest(url) {
    let response = await fetch(url, {
        method: 'GET'});
    return response.json();
}

function generate_iframe(data) {
  const container = document.getElementById("container");
  let id = data.id;
  for(let i = 0; i < id.length; i++) {
    let base = "https://open.spotify.com/embed/track/"
    let iframe = document.createElement("iframe");
    iframe.src = base + id[i];
    iframe.width = "80%";
    iframe.height = "275";
    container.insertBefore(iframe, container.firstChild);
  }
}