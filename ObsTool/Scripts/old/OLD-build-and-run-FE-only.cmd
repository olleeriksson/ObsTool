@echo off
echo #############################################################
echo #      Building and deploying ObsToolClient (Front-end)     #
echo #############################################################

cd C:\Users\Olle\source\repos\olleeriksson\ObsTool\ObsTool\ObsToolClient
npm install && npm run build && npm run deploy

echo -------------------------------------------------------------
echo |     After the web server has started you can close it     |
echo -------------------------------------------------------------
cd C:\Users\Olle\source\ObsToolWebserver
npm install && npm start
