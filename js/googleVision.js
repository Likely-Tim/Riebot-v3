const vision = require("@google-cloud/vision");
const dbGoogleVision = require("../databaseUtils/googleVision");
const {logger} = require("../utils/logger");
const path = require("path");

const GOOGLE_VISION_CREDENTIALS_PATH = process.env.GOOGLE_VISION_CREDENTIALS_PATH;

const client = new vision.ImageAnnotatorClient({keyFilename: path.join(__dirname, "..", GOOGLE_VISION_CREDENTIALS_PATH)});

async function textExtraction(messageAttachmentArray) {
  for (let i = 0; i < messageAttachmentArray.length; i++) {
    try {
      const url = messageAttachmentArray[i].url;
      const [result] = await client.textDetection(url);
      dbGoogleVision.putTextExtraction(url, result.fullTextAnnotation.text);
      logger.info(`[Google Vision] Extracted ${result.fullTextAnnotation.text} from ${url}`);
    } catch (error) {
      logger.info(`[Google Vision] Text Extraction Failed for ${url}`);
    }
  }
}

module.exports.textExtraction = textExtraction;
