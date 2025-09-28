# VEO Application Launcher
Write-Host "Starting VEO Application..." -ForegroundColor Green
Write-Host ""

# Change to the project root directory
Set-Location "C:\Users\benlallahom_yo\Desktop\finale"

# Start backend in a new PowerShell window
Write-Host "Starting Backend Server..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location 'C:\Users\benlallahom_yo\Desktop\finale\backend'; .\.venv\Scripts\activate; uvicorn src.resume.main:app --reload --port 8000"

# Wait a moment for backend to start
Start-Sleep -Seconds 3

# Start frontend in a new PowerShell window
Write-Host "Starting Frontend Server..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location 'C:\Users\benlallahom_yo\Desktop\finale\frontend'; npm run dev"

# Wait for frontend to start
Write-Host "Waiting for servers to initialize..." -ForegroundColor Cyan
Start-Sleep -Seconds 10

# Open browser
Write-Host "Opening application in browser..." -ForegroundColor Green
Start-Process "http://localhost:3000"

Write-Host ""
Write-Host "Application started successfully!" -ForegroundColor Green
Write-Host "- Backend: http://localhost:8000" -ForegroundColor White
Write-Host "- Frontend: http://localhost:3000" -ForegroundColor White
Write-Host ""
Write-Host "Press any key to exit this launcher..." -ForegroundColor Gray
Read-Host
