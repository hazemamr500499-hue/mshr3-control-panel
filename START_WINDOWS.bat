@echo off
chcp 65001 >nul
title GAME HUB FIREBASE
cd /d "%~dp0"
where node >nul 2>&1
if errorlevel 1 (
 echo ERROR: Install Node.js 18 or newer from nodejs.org
 pause
 exit /b 1
)
start "" /b cmd /c "timeout /t 2 >nul && start http://127.0.0.1:3000"
node server.cjs
if errorlevel 1 pause
