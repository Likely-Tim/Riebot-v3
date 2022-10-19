const express = require("express");
const router = express.Router();
const fetch = require("node-fetch");
const crypto = require("crypto");
const anilist = require("../utils/anilist");

// Databases
const dbToken = require("../databaseUtils/tokens.js");
const dbWeb = require("../databaseUtils/web");

const SPOTIFY_ID = process.env.SPOTIFY_ID;
const SPOTIFY_SECRET = process.env.SPOTIFY_SECRET;
const MAL_ID = process.env.MAL_ID;
const MAL_SECRET = process.env.MAL_SECRET;
const ANILIST_ID = process.env.ANILIST_ID;
const ANILIST_SECRET = process.env.ANILIST_SECRET;

const BASE_URL = process.env.BASE_URL;
const BASE_URL_ENCODED = process.env.BASE_URL_ENCODED;

router.get("/spotify", async (request, response) => {
  response.redirect(`https://accounts.spotify.com/en/authorize?client_id=ea2c1c3ca31d409db90f288951542b67&response_type=code&redirect_uri=${BASE_URL_ENCODED}auth%2Fspotify%2Fcallback&scope=user-read-recently-played%20user-top-read%20user-read-currently-playing%20user-read-playback-state&show_dialog=true`);
});

router.get("/mal", async (request, response) => {
  // When code challenge method is plain, code verifier = code challenge
  const codeVerifier = generatePKCECodeVerifier();
  await dbToken.put("malCodeVerifier", codeVerifier);
  const state = generatePKCECodeVerifier();
  await dbToken.put("malState", state);
  response.redirect(`https://myanimelist.net/v1/oauth2/authorize?response_type=code&client_id=${MAL_ID}&state=${state}&redirect_uri=${BASE_URL}auth/mal/callback&code_challenge=${codeVerifier}&code_challenge_method=plain`);
});

router.get("/anilist", async (request, response) => {
  const redirectUrl = request.query.redirectUrl;
  const task = request.query.task;
  if (redirectUrl) {
    response.cookie("redirectUrl", redirectUrl, { sameSite: "lax", maxAge: 600000 });
  }
  if (task) {
    response.cookie("task", task, { sameSite: "lax", maxAge: 600000 });
  }
  response.redirect(`https://anilist.co/api/v2/oauth/authorize?client_id=${ANILIST_ID}&redirect_uri=${BASE_URL}auth/anilist/callback&response_type=code`);
});

router.get("/anilist/callback", async (request, response) => {
  try {
    const redirectUrl = request.cookies.redirectUrl;
    const task = request.cookies.task;
    const accessToken = await anilistAccepted(request.query.code);
    if (task == "addAnimeShowUser") {
      response.clearCookie("task");
      const user = await anilist.getAuthenticatedUser(accessToken);
      await dbWeb.putAnimeShowUser(user.id, user.name);
    }
    if (redirectUrl) {
      response.clearCookie("redirectUrl");
      response.redirect(redirectUrl);
    } else {
      response.redirect("/");
    }
  } catch (error) {
    console.log(error);
  }
});

router.get("/spotify/callback", async (request, response) => {
  try {
    await spotifyAccepted(request.query.code);
    response.redirect("/?spotifySuccess=true");
  } catch (error) {
    console.log(error);
    response.redirect("/?spotifySuccess=false");
  }
});

router.get("/mal/callback", async (request, response) => {
  try {
    originalState = await dbToken.get("malState");
    if (originalState != request.query.state) {
      throw new Error("MAL state did not match.");
    }
    await malAccepted(request.query.code);
    response.redirect("/?malSuccess=true");
  } catch (error) {
    console.log(error);
    response.redirect("/?malSuccess=false");
  }
});

async function spotifyAccepted(code) {
  const url = "https://accounts.spotify.com/api/token";
  const authorization = Buffer.from(SPOTIFY_ID + ":" + SPOTIFY_SECRET).toString("base64");
  const data = {
    code: code,
    redirect_uri: `${BASE_URL}auth/spotify/callback`,
    grant_type: "authorization_code",
  };
  let response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: "Basic " + authorization,
    },
    body: new URLSearchParams(data),
  });
  if (response.status != 200) {
    throw new Error(response.statusText);
  }
  response = await response.json();
  await dbToken.put("spotifyAccess", response.access_token);
  await dbToken.put("spotifyRefresh", response.refresh_token);
}

async function malAccepted(code) {
  const url = "https://myanimelist.net/v1/oauth2/token";
  const codeVerifier = await dbToken.get("malCodeVerifier");
  const data = {
    client_id: MAL_ID,
    client_secret: MAL_SECRET,
    grant_type: "authorization_code",
    code: code,
    redirect_uri: `${BASE_URL}auth/mal/callback`,
    code_verifier: codeVerifier,
  };
  let response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(data),
  });
  if (response.status != 200) {
    throw new Error(response.status);
  }
  response = await response.json();
  await dbToken.put("malAccess", response.access_token);
  await dbToken.put("malRefresh", response.refresh_token);
}

async function anilistAccepted(code) {
  const url = "https://anilist.co/api/v2/oauth/token";
  const data = {
    grant_type: "authorization_code",
    client_id: ANILIST_ID,
    client_secret: ANILIST_SECRET,
    redirect_uri: `${BASE_URL}auth/anilist/callback`,
    code: code,
  };
  let response = await fetch(url, {
    method: "POST",
    header: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body: new URLSearchParams(data),
  });
  if (response.status != 200) {
    throw new Error(response.status);
  }
  response = await response.json();
  return response.access_token;
}

function generatePKCECodeVerifier() {
  return crypto.randomBytes(64).toString("hex");
}

function randomGenerator(length) {
  return crypto.randomBytes(length / 2).toString("hex");
}

module.exports = router;
