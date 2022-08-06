const express = require('express');
const router = express.Router();
const path = require('path');

const { refreshArknightsModules, getArknightsModules, updateModuleStatus } = require('../js/arknightsModules.js')


router.get('/', (request, response) => {
  response.send('Arknights Home');
})

router.get('/modules', (request, response) => {
  response.sendFile(path.join(__dirname, '../web/html/arknightsModules.html'));
});

router.get('/modules/operators', async (request, response) => {
  response.json(await getArknightsModules());
});

router.post('/modules/operators', async (request, response) => {
  if(request.body.hasOwnProperty("id") && request.body.hasOwnProperty("checked")) {
      await updateModuleStatus(request.body.id, request.body.checked);
      response.sendStatus(200);
  }
});
  
router.get('/modules/refresh', async (request, response) => {
  response.json(await refreshArknightsModules());
});

module.exports = router;