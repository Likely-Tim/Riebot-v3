sendGetRequest("/spotify_data").then((data) => {
  generateIframe(data);
});

async function sendGetRequest(url) {
  const response = await fetch(url, { method: "GET" });
  console.log(response);
  return response.json();
}

function generateIframe(data) {
  const container = document.getElementById("container");
  const id = data.id;
  for (let i = 0; i < id.length; i++) {
    const base = "https://open.spotify.com/embed/track/";
    const iframe = document.createElement("iframe");
    iframe.src = base + id[i];
    iframe.width = "80%";
    iframe.height = "275";
    container.insertBefore(iframe, container.firstChild);
  }
}
