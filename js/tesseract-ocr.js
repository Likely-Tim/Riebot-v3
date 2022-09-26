const tesseract = require("node-tesseract-ocr");
const dbTesseract = require("../databaseUtils/tesseract");
const {logger} = require("../utils/logger");

const config = {
  lang: "eng",
};

function checkURL(url) {
  return url.match(/\.(jpeg|jpg|gif|png)$/) != null;
}

async function tesseractExtractText(messageAttachmentArray) {
  for (let i = 0; i < messageAttachmentArray.length; i++) {
    try {
      const url = messageAttachmentArray[i].url;
      if (checkURL(url)) {
        const extractedText = await tesseract.recognize(url, config);
        dbTesseract.put(extractedText, url);
        console.log(extractedText);
      }
    } catch (error) {
      logger.info(`[Tesseract] Text Extraction Fail`);
    }
  }
}

module.exports.tesseractExtractText = tesseractExtractText;
