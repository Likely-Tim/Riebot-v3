#Run Bot
node index.js

#Always On: pm2
pm2 list: List Processes
pm2 start index.js: Start Process
pm2 kill: Kills pm2

pm2 start index.js --name Riebot-v3 --time --restart-delay=3000
pm2 restart 0