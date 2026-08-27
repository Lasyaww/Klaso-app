@echo off
title Klaso Backend Server (Auto-Restart)
cd /d "%~dp0"

:loop
echo ===================================================
echo Starting Klaso FastAPI Backend Server on port 8000...
echo ===================================================
.\venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8000
echo ===================================================
echo Server stopped. Restarting in 3 seconds...
echo ===================================================
timeout /t 3 /nobreak >nul
goto loop
