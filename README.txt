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

# ChartJS
sudo apt install fontconfig

# Add Callback
- Auth0
- Spotify
- MyAnimeList

# Install OracleDB
https://oracle.github.io/node-oracledb/INSTALL.html
# For Linux
sudo mkdir -p /opt/oracle
sudo cd /opt/oracle
sudo wget https://download.oracle.com/otn_software/linux/instantclient/instantclient-basic-linuxx64.zip
sudo unzip instantclient-basic-linuxx64.zip
sudo sh -c "echo /opt/oracle/instantclient_$VERSION > /etc/ld.so.conf.d/oracle-instantclient.conf"
sudo ldconfig

# For Linux & Windows
Download client credentials (Wallet) of autonomous database then move contents to /opt/oracle/network/admin

# Install pm2
npm install pm2@latest -g
pm2 link 9e2fulre781n7cz 116fxam405veywu

# pm2
pm2 list
pm2 start index.js --name Riebot-v3 --time --restart-delay=3000
pm2 kill
