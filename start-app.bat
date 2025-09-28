@echo off
title VEO Application Launcher
echo Starting VEO Application...
echo.

:: Change to the project root directory
cd /d "C:\Users\benlallahom_yo\Desktop\finale"

:: Start backend in a new window
echo Starting Backend Server...
start "Backend Server" cmd /k "cd backend && .\.venv\Scripts\activate && uvicorn src.resume.main:app --reload --port 8000"

:: Wait a moment for backend to start
timeout /t 3 /nobreak >nul

:: Start frontend in a new window
echo Starting Frontend Server...
start "Frontend Server" cmd /k "cd frontend && npm run dev"

:: Wait for frontend to start
echo Waiting for servers to initialize...
timeout /t 10 /nobreak >nul

:: Open browser
echo Opening application in browser...
start "" "http://localhost:3000"

echo.
echo Application started successfully!
echo - Backend: http://localhost:8000
echo - Frontend: http://localhost:3000
echo.
echo Press any key to exit this launcher...
pause >nul
