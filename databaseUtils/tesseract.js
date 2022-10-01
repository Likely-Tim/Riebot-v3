const {Level} = require("level");

const db = new Level("./databases/tesseract");

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

async function getAll(page) {
  const iterator = db.iterator();
  if (page == 1) {
    return await iterator.nextv(10);
  }
  let offset = (page - 1) * 10;
  await iterator.nextv(offset);
  return await iterator.nextv(10);
}

module.exports.put = put;
module.exports.get = get;
module.exports.getAll = getAll;
