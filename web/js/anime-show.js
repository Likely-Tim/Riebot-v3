sendGetRequest("/anime/current").then((response) => {
  const mediaArray = mediaParseByDay(response.media);
  mediaEnterDay(mediaArray);
});

const numberToDiv = { 0: "Sunday", 1: "Monday", 2: "Tuesday", 3: "Wednesday", 4: "Thursday", 5: "Friday", 6: "Saturday", 7: "Future" };

function mediaEnterDay(mediaArray) {
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

function mediaParseByDay(media) {
  // 0: Sunday
  const days = [[], [], [], [], [], [], [], []];
  for (let i = 0; i < media.length; i++) {
    // Check if aired already today
    let midnight = new Date();
    midnight.setHours(0, 0, 0, 0);
    const latestEpisode = getLatestEpisodeTime(media[i]);
    let date = new Date();
    date.setSeconds(date.getSeconds() + latestEpisode);
    if (latestEpisode != null && midnight < date) {
      days[date.getDay()].push(media[i]);
      continue;
    }
    let eod = new Date();
    eod.setHours(24, 0, 0, 0);
    let eow = eod;
    eow.setHours(eow.getHours() + 144);
    const nextEpisode = getNextEpisodeTime(media[i]);
    date = new Date();
    date.setSeconds(date.getSeconds() + nextEpisode);
    // Airing today or this week
    if (eod > date || eow > date) {
      days[date.getDay()].push(media[i]);
    } else {
      days[7].push(media[i]);
    }
  }
  return days;
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
