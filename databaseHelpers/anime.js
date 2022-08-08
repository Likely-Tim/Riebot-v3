const e = require("express");
const {Level} = require("level");

const db = new Level("./databases/anime");
const embeds = db.sublevel("", {valueEncoding: "json"});

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

async function putEmbed(key, value) {
  await embeds.put(key, value);
}

async function getEmbed(key) {
  try {
    return await embeds.get(key);
  } catch (error) {
    console.log(error);
  }
}

async function print() {
  for await (const [key, value] of db.iterator()) {
    console.log(key + " " + value);
  }
}

module.exports.put = put;
module.exports.get = get;
module.exports.getEmbed = getEmbed;
module.exports.putEmbed = putEmbed;
