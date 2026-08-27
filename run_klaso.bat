@echo off
title Klaso Launcher
cd /d "%~dp0"

echo ===================================================
echo Cleaning up old background processes...
echo ===================================================
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8000') do taskkill /F /PID %%a 2>nul
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5173') do taskkill /F /PID %%a 2>nul
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8081') do taskkill /F /PID %%a 2>nul

echo ===================================================
echo Launching Klaso Backend, Frontend ^& Mobile Servers...
echo ===================================================

start "Klaso Backend" cmd /k "cd /d %~dp0backend && run_backend.bat"
start "Klaso Frontend" cmd /k "cd /d %~dp0frontend && run_frontend.bat"
start "Klaso Mobile (Expo Go)" cmd /k "cd /d %~dp0mobile && npm start"

echo.
echo Servers launched!
echo Backend:  http://127.0.0.1:8000
echo Frontend: http://localhost:5173
echo Mobile:   Expo dev server (scan QR in Expo Go)
echo.
