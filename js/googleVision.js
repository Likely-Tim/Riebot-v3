const vision = require("@google-cloud/vision");
const dbGoogleVision = require("../databaseUtils/googleVision");
const {logger} = require("../utils/logger");
const CREDENTIALS = require("../credentials/googleVision.json");

const CONFIG = {
  credentials: {
    private_key: CREDENTIALS.private_key,
    client_email: CREDENTIALS.client_email,
  },
};
const client = new vision.ImageAnnotatorClient(CONFIG);

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
