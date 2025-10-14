# 🚀 iSentinel - AI Incident NFT System

**Turn every AI failure into an intelligent, verifiable NFT on 0G blockchain**

> **⚠️ FOR JUDGES**: Having testnet issues? See [JUDGE_SETUP_GUIDE.md](./JUDGE_SETUP_GUIDE.md) for quick solutions!

iSentinel creates accountability for AI systems by minting immutable NFT records of every incident, complete with verifiable proof stored on 0G's decentralized infrastructure.

---

## 📡 **Network Configuration**

**⚠️ IMPORTANT - Testnet Migration Notice:**

> **Note**: The 0G Galileo testnet recently underwent infrastructure changes. We redeployed the contract on **October 14, 2025** to ensure full functionality. The new contract address below is active and verified. Our demo video shows the complete live flow with real blockchain transactions.

### **Required Network Settings**

| Parameter | Value |
|-----------|-------|
| **Network Name** | 0G Galileo Testnet |
| **RPC URL** | `https://evmrpc-testnet.0g.ai` |
| **Chain ID** | `16602` |
| **Currency Symbol** | A0GI |
| **Block Explorer** | https://chainscan-galileo.0g.ai |

### **Current Contract Deployment (iNFT System)**

| Contract | Address | Purpose |
|----------|---------|---------|
| **🎨 INFT (iNFT)** | `0x5Ea36756B36dd41622b9C41FcD1a137f96954A06` | Advanced NFT with oracle + encryption |
| **📡 MockOracle** | `0x84c8542d439dA3cA5CaBE76b303444f66f190Db5` | Proof verification for secure transfers |
| **🔖 Legacy IncidentNFT** | `0x455163a08a8E786730607C5B1CC4E587837a1F57` | Original standard ERC721 (deprecated) |

**Deployment Date:** October 14, 2025  
**Network:** 0G Galileo Testnet  
**iNFT Features:** Oracle integration, encrypted metadata, usage authorization  

🔍 **Verify on Explorer**: 
- [View iNFT Contract](https://chainscan-galileo.0g.ai/address/0x5Ea36756B36dd41622b9C41FcD1a137f96954A06)
- [View Oracle Contract](https://chainscan-galileo.0g.ai/address/0x84c8542d439dA3cA5CaBE76b303444f66f190Db5)

📖 **Learn More:** See [INFT_IMPLEMENTATION.md](./INFT_IMPLEMENTATION.md) for complete iNFT documentation

---

## 🚨 Judge Quick Start (2 minutes)

**If you're experiencing testnet issues mentioned in feedback:**

1. **Run automatic setup**:
   ```bash
   # Windows
   quick-demo-setup.bat
   
   # Linux/Mac
   bash quick-demo-setup.sh
   ```

2. **Alternative - Mock Demo** (no blockchain needed):
   ```bash
   node backend/test-server.js  # Terminal 1
   cd frontend && pnpm run dev  # Terminal 2
   ```

3. **Open**: http://localhost:5173

**Full solutions in [JUDGE_SETUP_GUIDE.md](./JUDGE_SETUP_GUIDE.md)**

## � Table of Contents

- [🎯 Overview](#-overview)
- [⚡ Quick Start](#-quick-start)
- [🛠️ Prerequisites](#️-prerequisites)
- [📦 Installation](#-installation)
- [🔧 Configuration](#-configuration)
- [🚀 Running the Application](#-running-the-application)
- [💻 Demo Guide](#-demo-guide)
- [🔍 Troubleshooting](#-troubleshooting)
- [📚 Technical Details](#-technical-details)

## 🎯 Overview

### Key Features
- **AI Incident Reporting**: Submit detailed incident reports with logs and metadata
- **NFT Minting**: Each incident becomes a unique, transferable NFT on 0G blockchain
- **0G Storage Integration**: Immutable log storage on decentralized infrastructure
- **Wallet Integration**: Connect MetaMask to view and manage your incident NFTs
- **Real-time Dashboard**: Live blockchain data with incident analytics
- **Explorer Integration**: Direct links to 0G blockchain explorer for verification

### Tech Stack (75% 0G Integration)
- **Blockchain**: 0G Galileo Testnet (Chain ID: 16602) ✅
- **Storage**: 0G Storage SDK for decentralized file storage ✅
- **Smart Contract**: 0G iNFT with Oracle integration ✅
- **Backend**: Node.js with 0G Storage + iNFT integration
- **Frontend**: React + TypeScript + Tailwind CSS
- **Wallet**: MetaMask integration
- **Compute**: 0G Compute (Planned for AI verification) ⏳

## ⚡ Quick Start

### 1. Prerequisites Check
```powershell
# Check Node.js version (required: 18+)
node --version

# Check if you have MetaMask installed
# Visit: https://metamask.io/download/
```

### 2. Clone and Setup
```powershell
# Clone the repository
git clone <your-repo>
cd iSentinel

# Install dependencies
npm install

# Setup environment
copy .env.example .env
# Edit .env with your configuration
```

### 3. Start the Application
```powershell
# Terminal 1: Start Backend
node backend/serverOG.js

# Terminal 2: Start Frontend
cd frontend
npx vite
```

### 4. Open in Browser
- Frontend: http://localhost:5173
- Backend API: http://localhost:8787

## 🛠️ Prerequisites

### Required Software
- **Node.js 18+**: [Download here](https://nodejs.org/)
- **Git**: [Download here](https://git-scm.com/download/win)
- **MetaMask**: [Browser extension](https://metamask.io/download/)

### 0G Testnet Setup
1. **Add 0G Galileo Testnet to MetaMask**:
   - Network Name: `0G-Galileo-Testnet`
   - RPC URL: `https://evmrpc-testnet.0g.ai`
   - Chain ID: `16602`
   - Currency Symbol: `OG`
   - Block Explorer: `https://chainscan-galileo.0g.ai`

2. **Get Test Tokens**: You'll need OG tokens for gas fees
   - Use the 0G testnet faucet
   - Alternative: Contact 0G team for testnet tokens

### System Requirements
- **OS**: Windows 10/11
- **RAM**: 4GB minimum, 8GB recommended
- **Storage**: 2GB free space
- **Network**: Stable internet connection

## 📦 Installation

### 1. Clone Repository
```powershell
git clone <your-repository-url>
cd iSentinel
```

### 2. Install Dependencies
```powershell
# Install root dependencies
npm install

# Install frontend dependencies
cd frontend
npm install
cd ..
```

### 3. Environment Configuration
```powershell
# Copy environment template
copy .env.example .env

# Edit .env file with your settings
notepad .env
```

### Required Environment Variables
```env
# Blockchain Configuration
OG_RPC_URL=https://evmrpc-testnet.0g.ai
CHAIN_ID=16602
PRIVATE_KEY=your_private_key_here

# iNFT System (Deployed Oct 14, 2025)
ORACLE_ADDRESS=0x84c8542d439dA3cA5CaBE76b303444f66f190Db5
INFT_ADDRESS=0x5Ea36756B36dd41622b9C41FcD1a137f96954A06

# Legacy contract (standard ERC721)
INCIDENT_NFT_ADDRESS=0x455163a08a8E786730607C5B1CC4E587837a1F57

# 0G Storage Configuration
OG_STORAGE_URL=https://indexer-storage-testnet-turbo.0g.ai
OG_COMPUTE_URL=https://compute-testnet.0g.ai

# API Configuration
PORT=8787
BACKEND_API_URL=http://localhost:8787
```

## 🔧 Configuration

### Smart Contract Deployment (Optional)
If you need to deploy your own contract:

```powershell
# Compile contracts
npx hardhat compile

# Deploy to 0G testnet
npx hardhat run scripts/deployIncident.js --network og

# Update .env with new contract address
```

### MetaMask Setup
1. **Install MetaMask browser extension**
2. **Import your wallet** using the private key from `.env`
3. **Add 0G Galileo Testnet** (app will prompt automatically)
4. **Get test tokens** from the 0G faucet

## 🚀 Running the Application

### Development Mode

#### Start Backend Server
```powershell
# Navigate to project root
cd D:\path\to\iSentinel

# Start the backend
node backend/serverOG.js

# You should see:
# 🚀 iSentinel backend listening on :8787
# 📡 0G Storage integration enabled
# 🔗 Contract: 0x455163a08a8E786730607C5B1CC4E587837a1F57
```

#### Start Frontend Development Server
```powershell
# Open new terminal
cd D:\path\to\iSentinel\frontend

# Start frontend
npx vite

# You should see:
# ➜  Local:   http://localhost:5173/
```

### Production Build
```powershell
# Build frontend
cd frontend
npm run build

# Serve built files
npm run preview
```

## 💻 Demo Guide

### Complete Demo Flow (5-7 minutes)

#### 1. Connect Wallet (60 seconds)
1. **Open** http://localhost:5173
2. **Click "Connect Wallet"**
3. **Approve MetaMask connection**
4. **Add/Switch to 0G Galileo testnet** when prompted
5. **Verify connection** - should show your address

#### 2. Report AI Incident (90 seconds)
1. **Click "Report Incident"**
2. **Fill out the form**:
   - **Title**: `"GPT Model Hallucination - Financial Data"`
   - **Severity**: `Critical`
   - **Description**: `"AI model generated false financial information during customer query"`
   - **Logs**: `"ERROR: Model confidence: 0.23, Source: unknown, Validation: FAILED"`
   - **AI Model**: `"GPT-4"`
   - **Version**: `"v2.1.0"`
3. **Submit the report**
4. **Watch the process**:
   - ✅ Logs uploaded to 0G Storage
   - ✅ NFT minted on 0G blockchain
   - ✅ Success confirmation with transaction hash

#### 3. View and Interact with NFTs (60 seconds)
1. **See updated dashboard** with new incident
2. **Click on any incident** to view detailed report
3. **Check "Your Incident NFTs"** section (shows owned NFTs)
4. **Click NFT cards** to see comprehensive details
5. **Use "View on Explorer"** to verify on blockchain

#### 4. Demonstrate Key Features (45 seconds)
- **Real-time stats** update automatically
- **Search and filter** incidents by severity
- **Copy transaction hashes** and verify independently
- **Show 0G Storage integration** in backend logs

### Demo Script Highlights
- *"Every AI failure becomes verifiable proof on 0G blockchain"*
- *"Logs stored immutably on 0G decentralized storage"*
- *"NFTs are transferable - responsibility can be traded"*
- *"Full tech stack: 0G blockchain + storage + future compute"*

## 🔍 Troubleshooting

### Common Issues

#### Backend Won't Start
```powershell
# Check if port is in use
netstat -ano | findstr :8787

# Kill process if needed
taskkill /PID <process_id> /F

# Restart backend
node backend/serverOG.js
```

#### Frontend Build Errors
```powershell
# Clear node modules and reinstall
cd frontend
rm -rf node_modules package-lock.json
npm install

# Try building again
npm run build
```

#### MetaMask Connection Issues
1. **Reset MetaMask** if it won't connect
2. **Clear browser cache** and cookies
3. **Ensure 0G network is added** with correct parameters
4. **Check you have OG tokens** for gas fees

#### Contract Call Failures
```powershell
# Check your .env configuration
notepad .env

# Verify contract is deployed
# Check on: https://chainscan-galileo.0g.ai

# Test with different RPC endpoint if needed
```

#### 0G Storage Upload Fails
- **Check internet connection**
- **Verify 0G Storage nodes are accessible**
- **Ensure proper API endpoints in `.env`**
- **Check backend logs** for detailed error messages

### Environment-Specific Issues

#### Windows PowerShell Execution Policy
```powershell
# If scripts won't run:
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

#### Node.js Version Issues
```powershell
# Check version
node --version

# Update if needed (use Node.js 18+)
# Download from: https://nodejs.org/
```

### Getting Help
- **Check browser console** for frontend errors
- **Check terminal output** for backend errors
- **Verify all environment variables** are set correctly
- **Test with fresh MetaMask account** if wallet issues persist

## 📚 Technical Details

### Architecture Overview
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React Frontend │────│   Node.js API   │────│  0G Blockchain  │
│                 │    │                 │    │                 │
│ • Dashboard     │    │ • Incident API  │    │ • NFT Contract  │
│ • Wallet UI     │    │ • 0G Storage    │    │ • Event Logs    │
│ • Report Form   │    │ • Mint Script   │    │ • Ownership     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │   0G Storage    │
                    │                 │
                    │ • Log Files     │
                    │ • Metadata      │
                    │ • Immutable     │
                    └─────────────────┘
```

### Smart Contract Functions
- `mintIncident()`: Creates new incident NFT
- `getIncident()`: Retrieves incident data
- `burnIncident()`: Testnet cleanup (owner only)
- `ownerOf()`: Get NFT owner
- `balanceOf()`: Get user's NFT count

### API Endpoints
- `POST /incident`: Report new incident
- `GET /incidents`: List all incidents
- `GET /download?uri=0g://...`: Download from 0G Storage
- `GET /`: API status and info

### Data Flow
1. **User submits incident** → Frontend form
2. **Data sent to backend** → POST /incident
3. **Logs uploaded to 0G Storage** → Returns 0g:// URI
4. **NFT minted on blockchain** → Contract call
5. **Frontend updates** → Event-based refresh

### Security Considerations
- **Private keys** stored in `.env` (testnet only)
- **Input validation** on all form fields
- **Rate limiting** on API endpoints
- **CORS protection** for cross-origin requests

### Performance Optimizations
- **Event-based updates** instead of polling
- **Limited blockchain queries** (last 1000 blocks)
- **Cached incident data** in frontend state
- **Lazy loading** for large datasets

---

## 🎉 Ready to Demo!

Your iSentinel system is now ready for demonstration. The complete setup showcases:

✅ **Real AI incident reporting** with NFT minting  
✅ **0G Storage integration** for immutable logs  
✅ **MetaMask wallet connection** to 0G Galileo testnet  
✅ **Interactive dashboard** with real blockchain data  
✅ **Clickable NFTs** with detailed incident reports  
✅ **End-to-end verification** via blockchain explorer  

**Perfect for showcasing the power of 0G's full tech stack!** 🚀

---

*Built for 0G Hackathon - Demonstrating blockchain, storage, and future compute capabilities*

iSentinel maximizes the **0G tech stack** by using:
- **🔗 0G Blockchain**: Deploy and mint incident NFTs with immutable on-chain records
- **📦 0G Storage**: Store incident logs and metadata with cryptographic integrity
- **🌐 Full 0G URI Scheme**: Access data via `0g://` URIs for decentralized retrieval

---

## 🎯 Features

- **Verifiable AI Incidents**: Each AI failure becomes an ERC-721 NFT with structured incident data
- **Immutable Records**: Logs and metadata stored on 0G Storage with cryptographic root hashes
- **Transferable Responsibility**: NFTs can be transferred to assign incident ownership
- **Queryable System**: Smart contract events enable incident history tracking
- **Full 0G Integration**: Maximizes 0G Labs technology for competitive advantage

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ with ES modules support
- 0G testnet wallet with GI tokens for gas
- Windows PowerShell (or compatible shell)

### Installation

```bash
# Clone and install dependencies
git clone <your-repo>
cd 0G
pnpm install

# Set up environment
cp .env.example .env
# Edit .env with your private key
```

### Environment Setup

Create `.env` file:

```env
PRIVATE_KEY=your_private_key_here
OG_RPC_URL=https://evmrpc-testnet.0g.ai
OG_STORAGE_URL=https://indexer-storage-testnet-turbo.0g.ai

# Current Contract (Deployed Oct 14, 2025)
INCIDENT_NFT_ADDRESS=0x455163a08a8E786730607C5B1CC4E587837a1F57
```

---

## 🛠️ Usage

### Deploy Contract (One-time)

```bash
pnpm run deploy:og
```

### Report AI Incident

```bash
# Mint incident NFT with 0G Storage integration
pnpm run mint:incident

# Start backend API with 0G integration
pnpm run backend:og
```

### Example: Create Incident Report

```bash
# This will:
# 1. Upload incident logs to 0G Storage → 0g://0xabc123...
# 2. Upload metadata to 0G Storage → 0g://0xdef456...
# 3. Mint NFT on 0G blockchain with cryptographic references
node scripts/mintIncident.js --network og
```

**Output:**
```
✅ Uploaded incident-1759671965094.log to 0G Storage: 0g://0xb8abb868018567c988c5a7331912b0da9d186120ff8b1426196ed27fea87f725
✅ Uploaded incident-1759671965094.json to 0G Storage: 0g://0xa5ec099cd486287b72035af8d465e19034e88b59855ee4a1d05e8560ea3e84d2
✅ Minted incident token 6 tx: 0xd241906fac248d491933e567aa8e617504a8269613e5af6f1fdac549764ee9de
🎉 Successfully used 0G Storage for all data!
```

---

## 📊 Architecture

### Smart Contract: `IncidentNFT.sol`

```solidity
struct Incident {
    string incidentId;      // Unique identifier
    string logHash;         // 0G Storage root hash (0g://...)
    uint8 severity;         // 1-5 scale
    uint256 timestamp;      // Block timestamp
}

function mintIncident(
    address to,
    string memory incidentId,
    string memory logHash,
    uint8 severity
) external onlyOwner returns (uint256)
```

**Live Contract**: `0x455163a08a8E786730607C5B1CC4E587837a1F57` (Block 2286741) on 0G Galileo testnet

### 0G Storage Integration

**Upload Flow:**
1. Create incident log content and metadata
2. Upload to 0G Storage using `@0glabs/0g-ts-sdk`
3. Get cryptographic root hash (e.g., `0xabc123...`)
4. Generate 0G URI: `0g://0xabc123...`
5. Store URI on-chain in NFT metadata

**Download Flow:**
1. Query NFT for `logHash` field
2. Extract root hash from `0g://` URI
3. Download from 0G Storage using root hash
4. Verify content integrity

---

## 🔧 API Endpoints

### Backend Server (`pnpm run backend:og`)

```bash
# Report new incident (triggers 0G upload + NFT mint)
POST http://localhost:3001/incident
Content-Type: application/json

{
  "incidentId": "ai-failure-001",
  "severity": 3,
  "logs": "AI model failed at inference step..."
}

# Download from 0G Storage
GET http://localhost:3001/download?uri=0g://0xabc123...
```

---

## 🎬 Demo Flow

1. **Deploy**: `pnpm run deploy:og` → Contract on 0G blockchain
2. **Report**: `pnpm run mint:incident` → Logs to 0G Storage + NFT mint
3. **Verify**: Check transaction on 0G explorer
4. **Query**: Download incident data via 0G URIs

---

## 💡 0G Tech Stack Benefits

| Technology | Usage | Benefit |
|------------|-------|---------|
| **0G Blockchain** | NFT contract deployment & minting | Fast, low-cost transactions |
| **0G Storage** | Immutable log and metadata storage | Decentralized, verifiable data |
| **0G URIs** | Content addressing via root hashes | Cryptographic integrity |

---

## 📋 Smart Contract Events

```solidity
event IncidentMinted(
    uint256 indexed tokenId,
    address indexed to,
    string incidentId,
    string logHash,
    uint8 severity,
    uint256 timestamp
);
```

Query events for incident history and analytics.

---

## 🏆 Competitive Advantages

1. **Full 0G Stack**: Utilizes blockchain + storage + addressing
2. **Cryptographic Integrity**: Root hash verification
3. **Scalable Architecture**: Decentralized storage with on-chain references
4. **Developer Experience**: Simple APIs with powerful capabilities

---

## 🔮 Future Enhancements

- **0G Compute**: AI model verification and re-execution
- **Frontend Dashboard**: Web3 interface for incident browsing
- **Analytics**: Incident pattern recognition and reporting
- **Governance**: DAO for incident severity classification

---

## 📚 Tech Stack

- **Blockchain**: 0G Galileo testnet (Ethereum-compatible)
- **Storage**: 0G Storage SDK (`@0glabs/0g-ts-sdk`)
- **Smart Contracts**: Solidity + OpenZeppelin + Hardhat
- **Backend**: Node.js ES modules + Express
- **Frontend**: (Coming soon) React + Web3 integration

---

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Test with 0G testnet
4. Submit pull request

---

## 📄 License

MIT License - Build the future of AI accountability with 0G Labs!

---

**Built with ❤️ for the 0G ecosystem**

*Every AI failure deserves transparent, verifiable documentation.*
