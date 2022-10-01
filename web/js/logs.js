sendGetRequest("/logs/currentLogs").then((response) => {
  generateLogButtons(response);
});

async function sendGetRequest(url) {
  const response = await fetch(url, {method: "GET"});
  return await response.json();
}

async function sendGetFile(url) {
  return await fetch(url, {method: "GET"});
}

function generateLogButtons(response) {
  const logNames = response.logNames;
  let container = document.getElementById("buttonContainer");
  for (let i = 0; i < logNames.length; i++) {
    let button = document.createElement("button");
    button.setAttribute("id", logNames[i]);
    button.setAttribute("class", "logs");
    let text = document.createTextNode(logNames[i]);
    button.appendChild(text);
    button.addEventListener("click", logDisplay);
    container.appendChild(button);
  }
}

async function logDisplay(event) {
  let response = await sendGetFile(`/logs/${event.target.id}`);
  response = await response.text();
  document.getElementById("logContainer").innerText = response;
}
