@echo off
REM 🚀 Quick Start Script for Reminder App (Windows)

echo 🚀 Reminder App - Quick Start
echo ==============================
echo.

REM Check if Docker is installed
docker --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker is not installed. Please install Docker Desktop first.
    echo 📖 See: DOCKER_INSTALL.md
    pause
    exit /b 1
)

echo ✅ Docker is installed
echo.

REM Check if Docker daemon is running
docker info >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker daemon is not running. Please start Docker Desktop.
    pause
    exit /b 1
)

echo ✅ Docker daemon is running
echo.

echo Select mode:
echo 1) Production Mode - Full Docker Stack (RECOMMENDED)
echo 2) Development Mode - Database in Docker + Local Apps
echo 3) Stop everything
echo.
set /p mode="Choose (1-3): "

if "%mode%"=="1" (
    echo 🐳 Starting Production Mode...
    echo This will run everything in Docker containers.
    echo.
    
    if not exist ".env" (
        echo 📋 Creating .env from template...
        copy .env.docker .env >nul
        echo ⚠️  IMPORTANT: Edit .env and set secure passwords and OpenAI key:
        echo    Use notepad: notepad .env
        echo.
        pause
    )
    
    echo 🚀 Starting Docker Compose...
    docker compose up -d
    
    echo.
    echo ✅ Production Mode Started!
    echo.
    echo 📍 Access:
    echo    Frontend: http://localhost:3000
    echo    Backend:  http://localhost:3001
    echo    Health:   http://localhost:3001/health
    echo.
    echo 📊 Status:
    docker compose ps
    echo.
    echo 📖 View logs:
    echo    docker compose logs -f
    echo.
    pause
    
) else if "%mode%"=="2" (
    echo 🟡 Starting Development Mode...
    echo Database will run in Docker, Backend and Frontend locally.
    echo.
    
    REM Check if node is installed
    node --version >nul 2>&1
    if errorlevel 1 (
        echo ❌ Node.js is not installed.
        echo 📖 Install from: https://nodejs.org
        pause
        exit /b 1
    )
    
    for /f "tokens=*" %%i in ('node --version') do echo ✅ Node.js found: %%i
    echo.
    
    REM Check if npm dependencies are installed
    if not exist "backend\node_modules" (
        echo 📦 Installing backend dependencies...
        cd backend
        call npm install --silent
        cd ..
    )
    
    if not exist "frontend\node_modules" (
        echo 📦 Installing frontend dependencies...
        cd frontend
        call npm install --silent
        cd ..
    )
    
    echo.
    echo 🚀 Starting Database...
    docker compose up -d database
    
    echo ✅ Database started!
    echo.
    echo 📍 Next steps:
    echo.
    echo Terminal 1 - Backend (with hot-reload):
    echo    cd backend ^&^& npm run dev
    echo.
    echo Terminal 2 - Frontend (with hot-reload):
    echo    cd frontend ^&^& npm start
    echo.
    echo 📍 Access:
    echo    Frontend: http://localhost:3000
    echo    Backend:  http://localhost:3001
    echo.
    echo ✨ Code changes will auto-reload!
    echo.
    pause
    
) else if "%mode%"=="3" (
    echo 🛑 Stopping Docker Compose...
    docker compose down
    echo ✅ Stopped!
    echo.
    pause
    
) else (
    echo ❌ Invalid choice
    pause
    exit /b 1
)

echo.
echo 📖 More info:
echo    DOCKER_USAGE.md - Complete Docker guide
echo    DOCKER_CHEATSHEET.md - Quick reference
echo    README.md - API Documentation
echo.
echo Happy coding! 🎉
echo.
pause
