const express = require("express");
const app = express();
const {logger} = require("./utils/logger");
const {auth, requiresAuth} = require("express-openid-connect");

const config = {
  authRequired: false,
  auth0Logout: true,
  secret: "a long, randomly-generated string stored in env",
  baseURL: "http://localhost:3000",
  clientID: "7CVOME99pcKIB62JslqaU2XMaBHPkAsq",
  issuerBaseURL: "https://riebot-v3.us.auth0.com",
};

// Routing
const authService = require("./routes/auth");
const logs = require("./routes/logs");

app.use(auth(config));
app.use(express.json());
app.use(express.static("web"));

app.use("/auth", requiresAuth(), authService);
app.use("/logs", requiresAuth(), logs);

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
  app.listen(process.env.PORT || 3000, () => {
    logger.info("Server initialized");
  });
}

module.exports = initializeServer;
