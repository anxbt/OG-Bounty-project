# iSentinel - Hackathon Submission

## What it does

iSentinel mints NFTs for AI failures, creating immutable incident records on 0G blockchain. When AI models malfunction, iSentinel automatically creates verifiable NFTs containing immutable proof.

**Features:**
- AI Incident Reporting with logs, severity, model info
- NFT Minting on 0G blockchain with transferable ownership  
- 0G Storage Integration for permanent log storage
- Real-time Dashboard with filtering and analytics
- MetaMask Wallet Integration for NFT management
- Blockchain Verification via 0G explorer links

**Demo:** Connect wallet → Report incident → Logs to 0G Storage → NFT minted → View collection → Verify on explorer

## Problem it solves

AI failures are hidden, unverifiable, lack standardized tracking. Companies need transparency incentives and regulatory compliance requires immutable audit trails.

**Current issues:** Centralized databases altered/deleted, no authenticity proof, siloed data
**iSentinel solution:** Immutable blockchain records, transferable NFT accountability, verifiable proof, regulatory compliance

## Challenges

- **0G Storage SDK**: Required `ZgFile.fromFilePath()` for file uploads
- **Smart Contract ABI**: Used event-based NFT tracking vs enumerable functions  
- **Return Types**: Updated ABI for struct returns
- **Testnet Config**: Fixed Chain ID 16602 and RPC settings
- **Data Integration**: Replaced dummy data with real blockchain queries
- **Windows Dev**: Set execution policies and absolute paths

## Technologies

**Blockchain:** 0G Galileo Testnet, Solidity 0.8.28, Hardhat 3.0.6, Ethers.js 6.15.0, OpenZeppelin 5.4.0
**0G Ecosystem:** 0G Storage SDK, 0G iNFT Protocol, Oracle Integration, Storage Nodes, Explorer
**Smart Contracts:** iNFT (Advanced NFT), MockOracle (Proof Verification)
**Backend:** Node.js 20.x, HTTP server, child processes
**Frontend:** React 18.3.1, TypeScript 5.5.3, Vite 5.4.2, Tailwind CSS 3.4.1
**Tools:** ESLint, MetaMask, VS Code, PowerShell

## How we built it

**Architecture:** User → Backend → 0G Storage → iNFT Contract → Oracle → NFT

```solidity
contract INFT {
    // Advanced iNFT with oracle integration
    address public oracle;
    mapping(uint256 => bytes32) private _metadataHashes;
    mapping(uint256 => string) private _encryptedURIs;
    mapping(uint256 => mapping(address => bytes)) private _authorizations;
    
    function mint(address to, string calldata encryptedURI, bytes32 metadataHash) 
        external onlyOwner returns (uint256);
    
    function transfer(..., bytes calldata proof) 
        external nonReentrant;
}
```

**Process:**
1. Smart Contracts: iNFT with oracle + MockOracle for proof verification
2. Storage: Upload logs & metadata to 0G Storage via SDK  
3. Backend: Node.js API with iNFT minting pipeline
4. Frontend: React UI with ethers.js integration
5. Wallet: MetaMask connection with network switching
6. Security: Oracle-based proof verification for transfers

## What we learned

- 0G Storage provides decentralized file storage with merkle tree verification
- 0G blockchain offers fast, low-cost transactions for incident reporting
- NFTs represent real-world accountability beyond art
- Event-based data fetching needs careful state management
- Immutable audit trails have regulatory value
- Type safety critical for Web3 reliability

## What's next

**Short Term:** Advanced analytics, multi-chain support, AI platform APIs, automated detection
**Mid Term:** Enterprise dashboard, incident marketplace, insurance integration, compliance features  
**Long Term:** 0G Compute integration, cross-chain bridges, DAO governance, mobile app

**Vision:** Global standard for AI accountability where every system reports incidents for transparent, trustworthy AI ecosystem.