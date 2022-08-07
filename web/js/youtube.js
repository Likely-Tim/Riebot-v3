sendGetRequest("/youtube_data").then((data) => {
  generateIframe(data);
});

async function sendGetRequest(url) {
  const response = await fetch(url, { method: "GET" });
  return response.json();
}

function generateIframe(data) {
  const container = document.getElementById("container");
  const id = data.id;
  for (let i = 0; i < id.length; i++) {
    const base = "https://www.youtube.com/embed/";
    const iframe = document.createElement("iframe");
    iframe.src = base + id[i];
    iframe.allow = "picture-in-picture; encrypted-media";
    iframe.allowFullscreen = "true";
    container.insertBefore(iframe, container.firstChild);
  }
}
