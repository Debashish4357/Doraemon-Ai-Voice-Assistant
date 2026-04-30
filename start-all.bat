@echo off
echo ========================================
echo   Starting Doraemon AI Voice Agent
echo ========================================
echo.
echo This will start both backend and frontend servers
echo.

echo Starting Backend Server...
start "Doraemon Backend" cmd /k "start-backend.bat"

timeout /t 3 /nobreak > nul

echo Starting Frontend Server...
start "Doraemon Frontend" cmd /k "start-frontend.bat"

echo.
echo ========================================
echo   Both servers are starting!
echo ========================================
echo.
echo Backend: http://localhost:8000
echo Frontend: http://localhost:5173
echo.
echo Close the terminal windows to stop the servers
echo.
pause
