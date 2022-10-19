const { Level } = require("level");

const db = new Level("./databases/web");
const animeShowUsers = db.sublevel("animeShowUsers");

async function put(key, value) {
  await db.put(key, value);
}

async function get(key) {
  try {
    return await db.get(key);
  } catch (error) {
    console.log(error);
  }
}

async function putAnimeShowUser(key, value) {
  await animeShowUsers.put(key, value);
}

async function getAllAnimeShowUser() {
  try {
    return await animeShowUsers.iterator().all();
  } catch (error) {
    console.log(error);
  }
}

module.exports = { put, get, putAnimeShowUser, getAllAnimeShowUser };
