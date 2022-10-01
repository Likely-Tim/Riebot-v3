sendGetRequest("/tesseract?page=1").then((response) => {
  console.log(response);
});

async function sendGetRequest(url) {
  const response = await fetch(url, {method: "GET"});
  return await response.json();
}
