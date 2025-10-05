# iSentinel (Incident iNFTs) — Implementation Plan

This plan covers the smart contract, 0G integration, deployment, testing, and DX details to mint iNFTs that represent AI incident reports. It aligns with the current Hardhat + Ethers setup and adds the 0g.ai SDK for storage/compute.

## Goals
- Mint 1 iNFT per incident with on-chain evidence and off-chain metadata.
- Store minimal, indexed data on-chain: incidentId, logHash, severity, timestamp, tokenURI.
- Emit `IncidentMinted` event with key details for realtime indexing.
- Optional admin burn for testnet.
- Integrate 0G Storage for logs/metadata; leave hooks for 0G Compute/Oracle.

## Contract Design (IncidentNFT)
- Token standard: ERC721 (OpenZeppelin).
- Storage per tokenId:
  - incidentId: string (or bytes32 if we switch to UUID-encoded) — indexed via mapping
  - logHash: bytes32 (hash of raw logs in 0G Storage)
  - severity: enum { Info, Warning, Critical }
  - tokenURI: string (0g:// or ipfs:// metadata JSON)
  - timestamp: uint64 (block.timestamp at mint)
- Events:
  - `event IncidentMinted(uint256 indexed tokenId, string incidentId, bytes32 logHash, uint8 severity, string tokenURI, uint64 timestamp);`
  - `event IncidentUpdated(uint256 indexed tokenId, bytes32 logHash, string tokenURI);` (if we allow corrections/append-only)
  - `event IncidentBurned(uint256 indexed tokenId);`
- Access:
  - `mintIncident`: callable by authorized roles (owner or MINTER_ROLE). For hackathon: `onlyOwner`.
  - `burnIncident`: `onlyOwner` (testnet only, can be removed or gated by time-lock in prod).
- Query helpers:
  - `getIncident(uint256 tokenId)` returns the struct.
  - Optional indexes: `tokenByIncidentId[bytes32]` to prevent duplicates and quick lookup.

### Structs and Types
- enum Severity { Info, Warning, Critical }
- struct Incident { string incidentId; bytes32 logHash; uint8 severity; string tokenURI; uint64 timestamp; }

### Security/Integrity
- `logHash` is immutable post-mint to preserve tamper-evidence.
- `tokenURI` can be immutable, or optionally updatable by owner if we need post-mortem metadata expansion (recommend immutable for simplicity; use new mints for corrections).
- Reentrancy not needed on pure mints, but safe to extend OZ guards.

## 0G Integration
- Use `@0glabs/0g-ts-sdk` in backend scripts to:
  1) Upload incident logs to 0G Storage → get content URI
  2) Compute `logHash = keccak256(rawLogs)`
  3) Create metadata JSON (including link to logs, severity, timestamps, etc.) and store in 0G Storage → get `tokenURI`
  4) Call contract.mintIncident with (incidentId, logHash, severity, tokenURI)
- Keep room for future 0G Compute or an oracle that can verify proofs (not required for initial MVP).
- Env vars (Windows PowerShell):
  - Use a `.env` with KEY=value (no `export`) and load via `dotenv` in scripts.
  - Required: `PRIVATE_KEY`, `OG_RPC_URL`, `OG_STORAGE_URL`, `OG_COMPUTE_URL`.

## Hardhat Setup
- Add a `og` network in `hardhat.config.ts` using `process.env` with `dotenv`.
- Ensure ESM/CJS consistency (package.json uses "type": "module"). Prefer TypeScript scripts or switch to ESM-compatible imports in JS.
- Deployment script: deploy `IncidentNFT` and log address. Provide a seed/mint script that uploads to 0G and mints.

## Files to Add/Change
- contracts/IncidentNFT.sol — new ERC721 with incident data and events
- scripts/mintIncident.ts — Node script to: hash+upload logs to 0G, create metadata, mint
- scripts/deployIncident.ts — Deploy new contract
- hardhat.config.ts — add dotenv + og network
- test/IncidentNFT.test.ts — basic mint/emit/query tests
- lib/og.ts — thin wrapper around 0G Storage client
- README.md — quickstart, env, run commands
- PLAN.md — this document

## Event Schema
- IncidentMinted(tokenId, incidentId, logHash, severity, tokenURI, timestamp)
  - severity encoded as uint8 (0,1,2)

## TokenURI Schema (example)
{
  "name": "AI Incident #<tokenId>",
  "description": "Incident report for <incidentId>",
  "incidentId": "uuid-1234...",
  "severity": "critical",
  "logUri": "0g://...",
  "logHash": "0x...",
  "timestamp": 1725168123,
  "attributes": [{"trait_type":"severity","value":"critical"}]
}

## Tests (minimal)
- mints with expected fields and emits IncidentMinted
- prevents duplicate incidentId (if enforced)
- burn onlyOwner on testnet
- tokenURI matches provided value

## Acceptance Criteria
- Deploys on local Hardhat and testnet RPC provided in OG_RPC_URL
- Mint script successfully uploads to 0G Storage and mints 1 incident NFT
- Event appears with correct args and is indexable
- README documents steps for Windows PowerShell users

## Stretch
- Indexer script that listens to IncidentMinted and writes to local DB
- Add EIP-712 signatures for mint authorization from off-chain backend
- Add on-chain indexing by severity (Enumerable extensions)
