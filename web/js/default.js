const body = document.getElementsByTagName("main")[0];
const navBar = document.createElement("div");
navBar.setAttribute("class", "navbar");
const home = createAnchor("Home", "/");
const spotify = createDropdown("Spotify", ["Spotify Auth"], ["/auth?type=spotify"]);
const myAnimeList = createAnchor("MyAnimeList", "/auth?type=mal");
const logs = createAnchor("Logs", "/logs");
navBar.appendChild(home);
navBar.appendChild(spotify);
navBar.appendChild(myAnimeList);
navBar.appendChild(logs);

sendGetRequest("/user").then((response) => {
  let anchor;
  if (response.user) {
    anchor = createAnchor("Logout", "/logout");
  } else {
    anchor = createAnchor("Login", "/login");
  }
  anchor.setAttribute("class", "user");
  navBar.appendChild(anchor);
});

body.prepend(navBar);

function createAnchor(name, link) {
  const anchor = document.createElement("a");
  anchor.appendChild(document.createTextNode(name));
  anchor.setAttribute("href", link);
  return anchor;
}

function createDropdown(name, linkNames, links) {
  const div = document.createElement("div");
  div.setAttribute("class", "dropdown");
  const button = document.createElement("button");
  button.setAttribute("class", "dropbtn");
  button.appendChild(document.createTextNode(name));
  const i = document.createElement("i");
  i.setAttribute("class", "fa fa-caret-down");
  button.appendChild(i);
  div.appendChild(button);
  const dropdown = document.createElement("div");
  dropdown.setAttribute("class", "dropdown-content");
  for (let j = 0; j < linkNames.length; j++) {
    const anchor = createAnchor(linkNames[j], links[j]);
    dropdown.appendChild(anchor);
  }
  div.appendChild(dropdown);
  return div;
}

async function sendGetRequest(url) {
  const response = await fetch(url, {method: "GET"});
  return response.json();
}
