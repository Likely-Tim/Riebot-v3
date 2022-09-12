const {Level} = require("level");

const db = new Level("./databases/messageInteractions");
const collectors = db.sublevel("", {valueEncoding: "json"});

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

async function putCollector(key, value) {
  await collectors.put(key, value);
}

async function getCollector(key) {
  try {
    return await collectors.get(key);
  } catch (error) {
    console.log(error);
  }
}

module.exports.put = put;
module.exports.get = get;
module.exports.getCollector = getCollector;
module.exports.putCollector = putCollector;
