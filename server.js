const express = require("express");
const app = express();
var fs = require("fs");
var http = require("http");
var https = require("https");
const cookieParser = require("cookie-parser");
const { logger } = require("./utils/logger");
const { auth, requiresAuth } = require("express-openid-connect");

const SSL_KEY_PATH = process.env.SSL_KEY_PATH;
const SSL_CERTIFICATE_PATH = process.env.SSL_CERTIFICATE_PATH;

let sslKey = fs.readFileSync(SSL_KEY_PATH, "utf8");
let sslCertificate = fs.readFileSync(SSL_CERTIFICATE_PATH, "utf8");
let credentials = { key: sslKey, cert: sslCertificate };

let httpServer = http.createServer(app);
let httpsServer = https.createServer(credentials, app);

const auth0BaseUrl = process.env.BASE_URL;
const auth0ClientId = process.env.AUTH0_CLIENT_ID;
const auth0Secret = process.env.AUTH0_SECRET;

const config = {
  authRequired: false,
  auth0Logout: true,
  secret: auth0Secret,
  baseURL: auth0BaseUrl,
  clientID: auth0ClientId,
  issuerBaseURL: "https://riebot-v3.us.auth0.com",
};

// Routing
const authService = require("./routes/auth");
const logs = require("./routes/logs");
const googleVision = require("./routes/googleVision");
const anime = require("./routes/anime");
const { response } = require("express");

app.use(auth(config));
app.use(express.json());
app.use(express.static("web"));
app.use(cookieParser());

app.use("/auth", requiresAuth(), authService);
app.use("/logs", requiresAuth(), logs);
app.use("/googleVision", requiresAuth(), googleVision);
app.use("/anime", requiresAuth(), anime);

app.get("/", (request, response) => {
  response.sendFile(__dirname + "/web/html/index.html");
});

app.get("/user", (request, response) => {
  const user = request.oidc.user;
  if (user) {
    response.send({ user: user.name });
  } else {
    response.send({ user: undefined });
  }
});

app.all("/docs", (request, response) => {
  response.sendFile(__dirname + "/docs/index.html");
});

app.get("/spotify", (request, response) => {
  response.sendFile(__dirname + "/web/html/spotify.html");
});

app.get("/youtube", (request, response) => {
  response.sendFile(__dirname + "/web/html/youtube.html");
});

app.get("/favicon.ico", (request, response) => {
  response.sendFile(__dirname + "/web/favicon/favicon.ico");
});

app.all("*", (request, response) => {
  response.sendFile(__dirname + "/web/html/404.html");
});

function initializeServer() {
  httpServer.listen(3000, () => {
    logger.info("HTTP Server Initialized");
  });
  httpsServer.listen(8443, () => {
    logger.info("HTTPS Server Initialized");
  });
}

module.exports = initializeServer;
