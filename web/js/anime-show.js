const midnight = new Date();
midnight.setHours(0, 0, 0, 0);
const midnightUnix = midnight.getTime() / 1000;
const endOfDay = new Date();
endOfDay.setHours(24, 0, 0, 0);
const endOfDayUnix = endOfDay.getTime() / 1000;
const endOfWeek = endOfDay;
endOfWeek.setHours(endOfWeek.getHours() + 144);
const endOfWeekUnix = endOfWeek.getTime() / 1000;

sendGetRequest(`/anime/show/users`).then((response) => {
  const buttons = ["Airing"];
  const buttonId = ["Airing"];
  const users = response.users;
  for (let i = 0; i < users.length; i++) {
    buttons.push(users[i][1]);
    buttonId.push(users[i][0]);
  }
  buttons.push("+");
  buttonId.push("+");
  generateChoiceButtons(buttons, buttonId);
});

displayAiringAnime();

function displayAiringAnime() {
  document.getElementById("loading").style.display = "block";
  sendGetRequest(`/anime/show/airing?start=${midnightUnix}&end=${endOfWeekUnix}`).then((response) => {
    const mediaArray = mediaByDay(response.media);
    const sortedMediaArray = sortByPopularity(mediaArray);
    mediaGenerateHtml(sortedMediaArray);
    document.getElementById("loading").style.display = "none";
  });
}

function displayUserAnime(userId) {
  document.getElementById("loading").style.height = "100%";
  document.getElementById("loading").style.display = "block";
  sendGetRequest(`/anime/show/watching?userId=${userId}`).then((response) => {
    document.getElementsByTagName("main")[0].removeChild(document.getElementById("dayContainer"));
    const mediaArray = mediaByDay(response.media);
    const sortedMediaArray = sortByPopularity(mediaArray);
    mediaGenerateHtml(sortedMediaArray);
    document.getElementById("loading").style.display = "none";
  });
}

// sendGetRequest("/anime/current").then((response) => {
//   const mediaArray = mediaParseByDay(response.media);
//   mediaEnterDay(mediaArray);
//   document.getElementById("loading").style.display = "none";
// });

function generateChoiceButtons(buttons, buttonId) {
  const buttonContainer = document.createElement("div");
  buttonContainer.setAttribute("id", "choiceButtonContainer");
  for (let i = 0; i < buttons.length; i++) {
    const button = document.createElement("button");
    if (buttons[i] == "Airing") {
      button.setAttribute("class", "choiceButton active");
    } else if (buttons[i] == "+") {
      button.setAttribute("class", "choiceButton addition");
    } else {
      button.setAttribute("class", "choiceButton");
    }
    button.setAttribute("id", buttonId[i]);
    button.appendChild(document.createTextNode(buttons[i]));
    button.addEventListener("click", choiceButtonHandler);
    buttonContainer.appendChild(button);
  }
  document.getElementsByTagName("main")[0].appendChild(buttonContainer);
  document.getElementsByTagName("main")[0].appendChild(document.createElement("hr"));
}

function choiceButtonHandler(event) {
  if (this.id == "+") {
    window.location = "/auth/anilist?redirectUrl=/anime/show&task=addAnimeShowUser";
  } else {
    if (this.classList.contains("active")) {
      return;
    }
    document.getElementsByClassName("active")[0].classList.toggle("active");
    this.classList.toggle("active");
    if (this.id == "Airing") {
      displayAiringAnime();
    } else {
      displayUserAnime(this.id);
    }
  }
}

const numberToDiv = { 0: "Sunday", 1: "Monday", 2: "Tuesday", 3: "Wednesday", 4: "Thursday", 5: "Friday", 6: "Saturday", 7: "Future", 8: "Watching", 9: "Unending" };

function mediaGenerateHtml(mediaArray) {
  generateDayHtml(mediaArray);
  for (let dayId = 0; dayId < mediaArray.length; dayId++) {
    let day = numberToDiv[dayId] + "_Covers";
    for (let i = 0; i < mediaArray[dayId].length; i++) {
      let parent = document.getElementById(day);
      let div = document.createElement("div");
      div.setAttribute("class", "cover");
      let anchor = document.createElement("a");
      anchor.setAttribute("href", mediaArray[dayId][i].siteUrl);
      anchor.setAttribute("target", "_blank");
      anchor.setAttribute("rel", "noopener noreferrer");
      let image = document.createElement("img");
      image.setAttribute("src", mediaArray[dayId][i].coverImage.extraLarge);
      image.setAttribute("class", "covers");
      anchor.appendChild(image);
      div.appendChild(anchor);
      parent.appendChild(div);
    }
  }
  reorderDays();
}

function generateDayHtml(mediaArray) {
  const container = document.createElement("div");
  container.setAttribute("id", "dayContainer");
  for (let i = 0; i < mediaArray.length; i++) {
    if (mediaArray[i].length == 0) {
      continue;
    }
    const day = numberToDiv[i];
    const div = document.createElement("div");
    div.setAttribute("class", "day");
    div.setAttribute("id", day);
    const heading = document.createElement("h2");
    heading.appendChild(document.createTextNode(day));
    div.appendChild(heading);
    const covers = document.createElement("div");
    covers.setAttribute("class", "covers");
    covers.setAttribute("id", `${day}_Covers`);
    div.appendChild(covers);
    container.appendChild(div);
  }
  document.getElementsByTagName("main")[0].appendChild(container);
}

function reorderDays() {
  const date = new Date();
  let dayNumber = date.getDay();
  for (let i = 0; i < 7; i++) {
    dayNumber = dayNumber % 7;
    let day = numberToDiv[dayNumber];
    document.getElementById(day).style.order = i;
    dayNumber++;
  }
}

function mediaByDay(media) {
  const days = [[], [], [], [], [], [], [], [], [], []];
  for (let i = 0; i < media.length; i++) {
    if (!(media[i].format == "TV") && !(media[i].format == "TV_SHORT")) {
      continue;
    }
    if (media[i].nextAiringEpisode && media[i].nextAiringEpisode.episode > 100) {
      days[9].push(media[i]);
      continue;
    }
    // Check if aired already today
    const latestEpisode = getLatestEpisodeTime(media[i]);
    let date = new Date();
    date.setSeconds(date.getSeconds() + latestEpisode);
    if (latestEpisode != null && midnight < date) {
      days[date.getDay()].push(media[i]);
      continue;
    }
    // Find next airing episode
    if (!media[i].nextAiringEpisode) {
      days[8].push(media[i]);
      continue;
    }
    const nextAiringTime = media[i].nextAiringEpisode.airingAt;
    const nextAiringDate = new Date(nextAiringTime * 1000);
    // Airing today or this week
    if (endOfDay > nextAiringDate || endOfWeek > nextAiringDate) {
      days[nextAiringDate.getDay()].push(media[i]);
    } else {
      days[7].push(media[i]);
    }
  }
  return days;
}

function sortByPopularity(mediaArray) {
  for (let i = 0; i < mediaArray.length; i++) {
    mediaArray[i].sort((a, b) => {
      return b.popularity - a.popularity;
    });
  }
  return mediaArray;
}

function getLatestEpisodeTime(media) {
  for (let i = media.airingSchedule.nodes.length - 1; i >= 0; i--) {
    if (media.airingSchedule.nodes[i].timeUntilAiring < 0) {
      return media.airingSchedule.nodes[i].timeUntilAiring;
    }
  }
  return null;
}

function getNextEpisodeTime(media) {
  for (let i = 0; i < media.airingSchedule.nodes.length; i++) {
    if (media.airingSchedule.nodes[i].timeUntilAiring > 0) {
      return media.airingSchedule.nodes[i].timeUntilAiring;
    }
  }
  return null;
}

async function sendGetRequest(url) {
  const response = await fetch(url, { method: "GET" });
  return response.json();
}
