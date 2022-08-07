const puppeteer = require("puppeteer");
const { Level } = require("level");

// Create a database
const db = new Level("./databases/arknightsModule");
const pictures = db.sublevel("pictures");
const isFinished = db.sublevel("isFinished");

async function refreshArknightsModules() {
  const browser = await puppeteer.launch({
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  const page = await browser.newPage();
  await page.goto(
    "https://gamepress.gg/arknights/database/arknights-module-list",
    { waitUntil: "networkidle2" }
  );
  // Get Module List
  let moduleList = await page.$("div.modules-list");
  // Get NA Only Operators
  let naOperators = await moduleList.$$("tr.availserver-NA");
  // Get Name and Picture
  let operators = {};
  for (let i = 0; i < naOperators.length; i++) {
    const info = await naOperators[i].$("div.operator-info a");
    const operatorName = (
      await (await info.getProperty("href")).jsonValue()
    ).substring(40);
    const operatorPicture = (
      await (
        await (await info.getProperty("firstChild")).getProperty("currentSrc")
      ).jsonValue()
    ).split("?")[0];
    operators[operatorName] = operatorPicture;
    pictures.put(operatorName, operatorPicture);
  }
  return operators;
}

async function getArknightsModules() {
  let operators = {};
  for await (const [key, value] of pictures.iterator()) {
    operators[key] = [value];
  }
  for await (const [key, value] of isFinished.iterator()) {
    operators[key].push(value);
  }
  return operators;
}

async function updateModuleStatus(id, boolean) {
  await isFinished.put(id, boolean);
  return;
}

module.exports.refreshArknightsModules = refreshArknightsModules;
module.exports.getArknightsModules = getArknightsModules;
module.exports.updateModuleStatus = updateModuleStatus;
