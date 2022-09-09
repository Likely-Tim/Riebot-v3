const CryptoJS = require("crypto-js");
const {Level} = require("level");

const db = new Level("./databases/tokens");

const CRYPTO_PASSWORD = process.env.CRYPTO_PASSWORD;

async function put(key, value) {
  const encrypted = CryptoJS.AES.encrypt(value, CRYPTO_PASSWORD).toString();
  await db.put(key, encrypted);
}

async function get(key) {
  try {
    const encrypted = await db.get(key);
    const value = CryptoJS.AES.decrypt(encrypted, CRYPTO_PASSWORD).toString(CryptoJS.enc.Utf8);
    return value;
  } catch (error) {
    console.log(error);
  }
}

module.exports.put = put;
module.exports.get = get;
