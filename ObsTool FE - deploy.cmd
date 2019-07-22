@echo off
echo #############################################################
echo #      Building and deploying ObsToolClient (Front-end)     #
echo #############################################################

cd C:\Users\Olle\source\repos\ObsToolClient
npm install && npm run build && npm run deploy
cd C:\Users\Olle\source\repos\ObsToolWebserver

echo -------------------------------------------------------------
echo |     After the web server has started you can close it     |
echo -------------------------------------------------------------
npm install && npm start