@echo off
title Klaso Frontend Dev Server
cd /d "%~dp0"
echo ===================================================
echo Starting Klaso React Vite Frontend on port 5173...
echo ===================================================
set PATH=C:\Users\ADMIN\AppData\Local\Microsoft\WinGet\Packages\OpenJS.NodeJS.LTS_Microsoft.Winget.Source_8wekyb3d8bbwe\node-v24.19.0-win-x64;%PATH%
npm run dev
pause
