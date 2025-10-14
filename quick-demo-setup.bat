@echo off
echo 🚀 Setting up iSentinel for Judges...
echo.

:: Check if we're in the right directory
if not exist "package.json" (
    echo ❌ Please run this from the iSentinel project root directory
    echo    Current directory: %CD%
    echo    Make sure you can see package.json in this folder
    pause
    exit /b 1
)

echo 📦 Installing dependencies...
call npm install
if %errorlevel% neq 0 (
    echo ❌ Failed to install dependencies
    pause
    exit /b 1
)

echo.
echo 📡 Deploying fresh contract to 0G testnet...
echo    This will create a new working contract address...
call npm run deploy:incident:og
if %errorlevel% neq 0 (
    echo ❌ Contract deployment failed
    echo    Continuing with existing contract...
)

echo.
echo 🔧 Starting backend server...
echo    Opening new window for backend...
start "iSentinel Backend" cmd /k "echo Starting iSentinel Backend... && node backend/serverOG.js"

:: Wait a moment for backend to start
timeout /t 3 /nobreak >nul

echo.
echo 💻 Starting frontend...
echo    Installing frontend dependencies...
cd frontend
call pnpm install
if %errorlevel% neq 0 (
    echo ❌ Frontend dependencies failed, trying npm...
    call npm install
)

echo    Opening new window for frontend...
start "iSentinel Frontend" cmd /k "echo Starting iSentinel Frontend... && pnpm run dev"

cd ..

echo.
echo ✅ Setup complete!
echo.
echo 🌐 Frontend will open at: http://localhost:5173
echo ⚡ Backend API running at: http://localhost:8787
echo.
echo 🔗 MetaMask Setup:
echo    Network Name: 0G Galileo Testnet
echo    RPC URL: https://evmrpc-testnet.0g.ai
echo    Chain ID: 16602
echo    Symbol: A0GI
echo    Explorer: https://chainscan-galileo.0g.ai
echo.
echo 💡 If you see errors:
echo    1. Check if you have test tokens in your wallet
echo    2. Try the mock demo: node backend/test-server.js
echo    3. Make sure MetaMask is connected to 0G testnet
echo.
echo 🎬 Ready for demo! Both servers are running in separate windows.
echo.
echo Press any key to close this setup window...
pause >nul
