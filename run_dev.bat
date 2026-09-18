@echo off
title Apex Software Development Launcher
echo ===================================================
echo   Starting Apex Software Platform (Full Stack)
echo ===================================================
echo.
echo [1/2] Launching Backend Server on port 3000...
start "Apex Backend Server" cmd /k "cd /d apex-backend && npm start"

timeout /t 2 >nul

echo [2/2] Launching Expo Frontend for Expo Go...
start "Apex Expo App" cmd /k "cd /d apex-app && npx expo start --go"

echo.
echo ===================================================
echo   Both services started!
echo   - Backend: http://localhost:3000
echo   - Frontend: http://localhost:8081
echo ===================================================
