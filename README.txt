# Install Bot
git clone https://github.com/Likely-Tim/Riebot-v3

# Install NVM and Node
wget -qO- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.1/install.sh | bash
source ~/.bashrc
nvm install v16.16.0

# Install Packages
cd Riebot-v3/
npm install

#Run Bot
node index.js

# For Low Memory Machines
sudo fallocate -l 1G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
sudo cp /etc/fstab /etc/fstab.bak
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

# Redirect Ports for Node
sudo iptables -I INPUT -j ACCEPT
sudo iptables -t nat -A PREROUTING -p tcp --dport 80 -j REDIRECT --to-ports 3000
sudo iptables -t nat -A PREROUTING -p tcp --dport 443 -j REDIRECT --to-ports 8443
sudo netfilter-persistent save


#Always On: pm2
pm2 list: List Processes
pm2 start index.js: Start Process
pm2 kill: Kills pm2

pm2 start index.js --name Riebot-v3 --time --restart-delay=3000
pm2 restart 0
