#!/bin/bash

# 🚀 Quick Start Script for Reminder App

set -e

echo "🚀 Reminder App - Quick Start"
echo "=============================="
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker Desktop first."
    echo "📖 See: DOCKER_INSTALL.md"
    exit 1
fi

# Check if Docker daemon is running
if ! docker info &> /dev/null; then
    echo "❌ Docker daemon is not running. Please start Docker Desktop."
    exit 1
fi

echo "✅ Docker is installed and running"
echo ""

# Ask user which mode to run
echo "Select mode:"
echo "1) Production Mode - Full Docker Stack (RECOMMENDED)"
echo "2) Development Mode - Database in Docker + Local Apps"
echo "3) Stop everything"
echo ""
read -p "Choose (1-3): " mode

case $mode in
    1)
        echo "🐳 Starting Production Mode..."
        echo "This will run everything in Docker containers."
        echo ""
        
        # Check if .env exists
        if [ ! -f ".env" ]; then
            echo "📋 Creating .env from template..."
            cp .env.docker .env
            echo "⚠️  IMPORTANT: Edit .env and set secure passwords and OpenAI key:"
            echo "   nano .env"
            echo ""
            read -p "Press Enter when ready..."
        fi
        
        echo "🚀 Starting Docker Compose..."
        docker compose up -d
        
        echo ""
        echo "✅ Production Mode Started!"
        echo ""
        echo "📍 Access:"
        echo "   Frontend: http://localhost:3000"
        echo "   Backend:  http://localhost:3001"
        echo "   Health:   http://localhost:3001/health"
        echo ""
        echo "📊 Status:"
        docker compose ps
        echo ""
        echo "📖 View logs:"
        echo "   docker compose logs -f"
        echo ""
        ;;
        
    2)
        echo "🟡 Starting Development Mode..."
        echo "Database will run in Docker, Backend and Frontend locally."
        echo ""
        
        # Check if node is installed
        if ! command -v node &> /dev/null; then
            echo "❌ Node.js is not installed."
            echo "📖 Install from: https://nodejs.org"
            exit 1
        fi
        
        echo "✅ Node.js found: $(node --version)"
        echo ""
        
        # Check if npm dependencies are installed
        if [ ! -d "backend/node_modules" ]; then
            echo "📦 Installing backend dependencies..."
            cd backend
            npm install --silent
            cd ..
        fi
        
        if [ ! -d "frontend/node_modules" ]; then
            echo "📦 Installing frontend dependencies..."
            cd frontend
            npm install --silent
            cd ..
        fi
        
        echo ""
        echo "🚀 Starting Database..."
        docker compose up -d database
        
        echo "✅ Database started!"
        echo ""
        echo "📍 Next steps:"
        echo ""
        echo "Terminal 1 - Backend (with hot-reload):"
        echo "   cd backend && npm run dev"
        echo ""
        echo "Terminal 2 - Frontend (with hot-reload):"
        echo "   cd frontend && npm start"
        echo ""
        echo "📍 Access:"
        echo "   Frontend: http://localhost:3000"
        echo "   Backend:  http://localhost:3001"
        echo ""
        echo "✨ Code changes will auto-reload!"
        echo ""
        ;;
        
    3)
        echo "🛑 Stopping Docker Compose..."
        docker compose down
        echo "✅ Stopped!"
        echo ""
        ;;
        
    *)
        echo "❌ Invalid choice"
        exit 1
        ;;
esac

echo ""
echo "📖 More info:"
echo "   DOCKER_USAGE.md - Complete Docker guide"
echo "   DOCKER_CHEATSHEET.md - Quick reference"
echo "   README.md - API Documentation"
echo ""
echo "Happy coding! 🎉"
