const express = require("express");
const app = express();
var fs = require("fs");
var http = require("http");
var https = require("https");
const {logger} = require("./utils/logger");
const {auth, requiresAuth} = require("express-openid-connect");

let key = fs.readFileSync("./sslcert/key.pem", "utf8");
let certificate = fs.readFileSync("./sslcert/cert.pem", "utf8");
let credentials = {key: key, cert: certificate};

let httpServer = http.createServer(app);
let httpsServer = https.createServer(credentials, app);

const auth0BaseUrl = process.env.AUTH0_BASE_URL;
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

app.use(auth(config));
app.use(express.json());
app.use(express.static("web"));

app.use("/auth", requiresAuth(), authService);
app.use("/logs", requiresAuth(), logs);
app.use("/googleVision", requiresAuth(), googleVision);

app.get("/", (request, response) => {
  response.sendFile(__dirname + "/web/html/index.html");
});

app.get("/user", (request, response) => {
  const user = request.oidc.user;
  if (user) {
    response.send({user: user.name});
  } else {
    response.send({user: undefined});
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

app.all("*", (request, response) => {
  response.sendFile(__dirname + "/docs" + request.url);
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
