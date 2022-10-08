const fetch = require("node-fetch");
const crypto = require("crypto");
const vision = require("@google-cloud/vision");
const {logger} = require("../utils/logger");
const path = require("path");
const oracle = require("../utils/oracle");

const ORACLE_BUCKET_NAME = "Discord_Pictures";
const GOOGLE_VISION_CREDENTIALS_PATH = process.env.GOOGLE_VISION_CREDENTIALS_PATH;

const googleClient = new vision.ImageAnnotatorClient({keyFilename: path.join(__dirname, "..", GOOGLE_VISION_CREDENTIALS_PATH)});

async function textExtraction(messageAttachmentArray) {
  for (let i = 0; i < messageAttachmentArray.length; i++) {
    const url = messageAttachmentArray[i].url;
    const fileExtension = url.split(".").pop();
    if (fileExtension == "jpg" || fileExtension == "png") {
      const urlHash = crypto.createHash("sha256").update(url).digest("hex");
      const fileName = `${urlHash}.${fileExtension}`;
      try {
        logger.info(`[Text Extraction] Trying Oracle for ${url}`);
        const readableStream = (await fetch(url)).body;
        await oracle.putObject(fileName, ORACLE_BUCKET_NAME, readableStream);
        const [text, objects] = await oracle.analyzeImage(fileName, ORACLE_BUCKET_NAME);
        await oracle.discordPicturesTableInsert(fileName, text, objects, url);
        logger.info("[Text Extraction] Oracle Success");
      } catch (error) {
        logger.info(`[Text Extraction] Oracle Fail: ${error}`);
        try {
          logger.info(`[Text Extraction] Trying Google for ${url}`);
          const [result] = await googleClient.textDetection(url);
          const text = result.fullTextAnnotation.text;
          await oracle.discordPicturesTableInsert(fileName, text, "", url);
          logger.info(`[Text Extraction] Google Success`);
        } catch (error) {
          logger.info(`[Text Extraction] Google Fail: ${error}`);
        }
      }
    }
  }
}

module.exports.textExtraction = textExtraction;
