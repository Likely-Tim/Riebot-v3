const {Level} = require("level");

const db = new Level("./databases/googleVision");
const textExtraction = db.sublevel("textExtraction");

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

async function putTextExtraction(key, value) {
  await textExtraction.put(key, value);
}

async function getTextExtraction(key) {
  try {
    return await textExtraction.get(key);
  } catch (error) {
    console.log(error);
  }
}

async function getAllTextExtraction(page) {
  const iterator = textExtraction.iterator();
  if (page == 1) {
    return await iterator.nextv(10);
  }
  let offset = (page - 1) * 10;
  await iterator.nextv(offset);
  return await iterator.nextv(10);
}

module.exports.put = put;
module.exports.get = get;
module.exports.putTextExtraction = putTextExtraction;
module.exports.getTextExtraction = getTextExtraction;
module.exports.getAllTextExtraction = getAllTextExtraction;
