const {Level} = require("level");

const db = new Level("./databases/spotify");

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

module.exports.put = put;
module.exports.get = get;
