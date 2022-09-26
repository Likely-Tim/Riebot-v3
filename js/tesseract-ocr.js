const tesseract = require("node-tesseract-ocr");
const dbTesseract = require("../databaseUtils/tesseract");

const config = {
  lang: "eng",
};

async function tesseractExtractText(messageAttachmentArray) {
  for (let i = 0; i < messageAttachmentArray.length; i++) {
    const url = messageAttachmentArray[i].url;
    const extractedText = await tesseract.recognize(url, config);
    dbTesseract.put(extractedText, url);
  }
}

module.exports.tesseractExtractText = tesseractExtractText;
