@echo off
title Borg El Arab Tech - Digital Platform
echo ========================================================
echo   Starting Borg El Arab Tech Platform (Port 5000)
echo ========================================================
echo.
cd /d "%~dp0node-backend"
timeout /t 1 >nul
start "" http://localhost:5000/login
node index.js
pause
