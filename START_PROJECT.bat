@echo off
echo ============================================================
echo Starting Dairy ^& Medical Management System...
echo Node.js Version Required: v24.15.0
echo ============================================================
echo.

echo Launching Backend Server (http://localhost:5000)...
start "Dairy ^& Medical Backend" cmd /k "cd /d %~dp0server && npm run dev"

echo Launching Frontend Client (http://localhost:5173)...
start "Dairy ^& Medical Frontend" cmd /k "cd /d %~dp0client && npm run dev"

echo.
echo Both servers are launching in separate windows.
echo - Backend API: http://localhost:5000/api/health
echo - Frontend Web: http://localhost:5173
echo.
pause
