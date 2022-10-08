const common = require("oci-common");
const os = require("oci-objectstorage");
const aivision = require("oci-aivision");
const {logger} = require("../utils/logger");
const oracledb = require("oracledb");

const ORACLE_CONFIG_PATH = process.env.ORACLE_CONFIG_PATH;
const ORACLE_OBJECT_STORAGE_NAMESPACE = process.env.ORACLE_OBJECT_STORAGE_NAMESPACE;
const ORACLE_COMPARTMENT = process.env.ORACLE_COMPARTMENT;
const ORACLE_AUTONOMOUS_DATABASE_USER = process.env.ORACLE_AUTONOMOUS_DATABASE_USER;
const ORACLE_AUTONOMOUS_DATABASE_PASSWORD = process.env.ORACLE_AUTONOMOUS_DATABASE_PASSWORD;
const ORACLE_AUTONOMOUS_DATABASE_CONNECTION = process.env.ORACLE_AUTONOMOUS_DATABASE_CONNECTION;

const provider = new common.ConfigFileAuthenticationDetailsProvider(ORACLE_CONFIG_PATH);
const objectStorageClient = new os.ObjectStorageClient({authenticationDetailsProvider: provider});
const aiVisionClient = new aivision.AIServiceVisionClient({authenticationDetailsProvider: provider});
let databaseConnection;
oracledb.autoCommit = true;
oracledb.dbObjectAsPojo = true;
oracledb
  .getConnection({
    user: ORACLE_AUTONOMOUS_DATABASE_USER,
    password: ORACLE_AUTONOMOUS_DATABASE_PASSWORD,
    connectString: ORACLE_AUTONOMOUS_DATABASE_CONNECTION,
  })
  .then((result) => {
    logger.info("Oracle Autonomous Database Connected");
    databaseConnection = result;
  })
  .catch((error) => {
    logger.info(error);
  });

async function putObject(objectName, bucketName, readableStream) {
  const putObjectRequest = {
    namespaceName: ORACLE_OBJECT_STORAGE_NAMESPACE,
    bucketName: bucketName,
    objectName: objectName,
    putObjectBody: readableStream,
  };
  await objectStorageClient.putObject(putObjectRequest);
}

async function analyzeImage(objectName, bucketName) {
  const analyzeImageDetails = {
    compartmentId: ORACLE_COMPARTMENT,
    features: [
      {
        featureType: "OBJECT_DETECTION",
      },
      {
        featureType: "TEXT_DETECTION",
      },
    ],
    image: {
      objectName: objectName,
      source: "OBJECT_STORAGE",
      bucketName: bucketName,
      namespaceName: ORACLE_OBJECT_STORAGE_NAMESPACE,
    },
  };
  const response = await aiVisionClient.analyzeImage({analyzeImageDetails: analyzeImageDetails});
  return analyzeImageParse(response.analyzeImageResult);
}

function analyzeImageParse(analyzeImageResult) {
  const objects = [];
  let text = [];
  for (let i = 0; i < analyzeImageResult.imageObjects.length; i++) {
    if (analyzeImageResult.imageObjects[i].confidence > 0.5) {
      objects.push(analyzeImageResult.imageObjects[i].name);
    }
  }
  for (let i = 0; i < analyzeImageResult.imageText.lines.length; i++) {
    if (analyzeImageResult.imageText.lines[i].confidence > 0.5) {
      text.push(analyzeImageResult.imageText.lines[i].text);
    }
  }
  return [text.join("\n"), objects.join(", ")];
}

async function discordPicturesTableInsert(fileName, text, tags, url) {
  fileName = escapeSingleQuotes(fileName);
  text = escapeSingleQuotes(text);
  tags = escapeSingleQuotes(tags);
  url = escapeSingleQuotes(url);
  await databaseConnection.execute(`INSERT INTO DISCORDPICTURES VALUES ('${fileName}', '${text}', '${tags}', '${url}')`);
}

function escapeSingleQuotes(string) {
  return string.replaceAll("'", "''");
}

module.exports = {analyzeImage, putObject, discordPicturesTableInsert};
