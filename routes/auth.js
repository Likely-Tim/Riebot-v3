const express = require('express');
const router = express.Router();
const path = require('path');
const fetch = require('node-fetch');
const crypto = require('crypto');

// Databases
const dbToken = require('../databaseHelpers/tokens.js');

const SPOTIFY_ID = process.env.SPOTIFY_ID;
const SPOTIFY_SECRET = process.env.SPOTIFY_SECRET;
const MAL_ID = process.env.MAL_ID;
const MAL_SECRET = process.env.MAL_SECRET;

router.get('/', async (request, response) => {
    if (request.query.type == "mal") {
      // When code challenge method is plain, code verifier = code challenge
      const codeVerifier = generatePKCECodeVerifier();
      await dbToken.put("malCodeVerifier", codeVerifier);
      const state = generatePKCECodeVerifier();
      await dbToken.put("malState", state);
      response.redirect(`https://myanimelist.net/v1/oauth2/authorize?response_type=code&client_id=${MAL_ID}&state=${state}&redirect_uri=http://44.242.76.174/auth/mal&code_challenge=${codeVerifier}&code_challenge_method=plain`);
    } else {
      response.redirect('/');
    }
})

router.get('/spotify', async (request, response) => {
    try {
        await spotifyAccepted(request.query.code);
        response.redirect('/?spotifySuccess=true');
    } catch (error) {
        console.log(error);
        response.redirect('/?spotifySuccess=false');
    }
});

router.get('/mal', async (request, response) => {
  console.log(request);
  try {
    originalState = await dbToken.get("malState");
    if (originalState != request.query.state) {
      throw new Error("MAL state did not match.");
    }
    await malAccepted(request.query.code);
    response.redirect('/?malSuccess=true');
  } catch (error) {
    console.log(error);
    response.redirect('/?malSuccess=false');
  }
});

async function spotifyAccepted(code) {
  const url = 'https://accounts.spotify.com/api/token';
  const authorization = Buffer.from(SPOTIFY_ID + ":" + SPOTIFY_SECRET).toString("base64");
  const data = {code: code, redirect_uri: 'http://44.242.76.174/auth/spotify', grant_type: 'authorization_code'};
  let response = await fetch(url, {
    method: 'POST',
    headers: {'Content-Type': 'application/x-www-form-urlencoded', 'Authorization': 'Basic ' + authorization},
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
  const data = {client_id: MAL_ID, client_secret: MAL_SECRET, grant_type: "authorization_code", code: code, redirect_uri: "http://44.242.76.174/auth/mal", code_verifier: codeVerifier};
  let response = await fetch(url, {
    method: "POST",
    headers: {'Content-Type': 'application/x-www-form-urlencoded'},
    body: new URLSearchParams(data),
  });
  if (response.status != 200) {
    throw new Error(response.status);
  }
  response = await response.json();
  await dbToken.put("malAccess", response.access_token);
  await dbToken.put("malRefresh", response.refresh_token);
}

function generatePKCECodeVerifier() {
  return crypto.randomBytes(64).toString('hex');
}

module.exports = router;