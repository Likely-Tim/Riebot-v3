sendGetRequest("/youtube_data")
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
    let base = "https://www.youtube.com/embed/"
    let iframe = document.createElement("iframe");
    iframe.src = base + id[i];
    iframe.allow = "picture-in-picture; encrypted-media";
    iframe.allowFullscreen = "true";
    container.insertBefore(iframe, container.firstChild);
  }
}