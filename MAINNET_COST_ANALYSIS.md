# iSentinel Mainnet Deployment Cost Analysis

## Executive Summary

**Total Deployment Gas Required:** 3,902,000 gas

This includes:
- MockOracle contract deployment
- INFT (ERC721) contract deployment with advanced features
- Initial setup (2 authorized attestors)

---

## Detailed Gas Breakdown

### Contract Deployments

| Contract | Bytecode Size | Estimated Gas | Purpose |
|----------|---------------|---------------|---------|
| **MockOracle** | 417 bytes | 154,400 gas | Oracle verification (can use existing oracles on mainnet) |
| **INFT Contract** | 16,633 bytes | 3,647,600 gas | Main NFT contract with attestation system |
| **Setup Operations** | - | 100,000 gas | Authorize 2 attestor addresses |
| **TOTAL** | - | **3,902,000 gas** | Full deployment |

---

## Cost Estimates by Network

### 🔷 Ethereum Mainnet

| Scenario | Gas Price | ETH Cost | USD Cost* |
|----------|-----------|----------|-----------|
| **Low** (Off-peak) | 15 Gwei | 0.0585 ETH | **$117** |
| **Medium** (Normal) | 30 Gwei | 0.1171 ETH | **$234** |
| **High** (Peak) | 50 Gwei | 0.1951 ETH | **$390** |
| **Extreme** (Congested) | 100 Gwei | 0.3902 ETH | **$780** |

*Assuming ETH = $2,000 USD

### 💚 0G Mainnet (RECOMMENDED)

| Scenario | Gas Price | OG Cost | USD Cost* |
|----------|-----------|---------|-----------|
| **Low** | 0.001 Gwei | 0.000004 OG | **$0.01** |
| **Medium** | 0.01 Gwei | 0.000039 OG | **$0.08** |
| **High** | 0.1 Gwei | 0.000390 OG | **$0.78** |
| **Extreme** | 1 Gwei | 0.003902 OG | **$7.80** |

**💰 SAVINGS: 99.97% cheaper than Ethereum!**

---

## Operational Costs (Per 100 Incidents)

### Gas per Operation
- **Mint Incident NFT:** 150,000 gas
- **Add AI Attestation:** 100,000 gas
- **Transfer NFT:** 80,000 gas

### Total for 100 Full Cycles (Mint + Attest)
- **Gas Required:** 25,000,000 gas

#### On Ethereum Mainnet:
| Scenario | ETH Cost | USD Cost |
|----------|----------|----------|
| Low | 0.375 ETH | $750 |
| Medium | 0.750 ETH | $1,500 |
| High | 1.250 ETH | $2,500 |
| Extreme | 2.500 ETH | $5,000 |

#### On 0G Network:
| Scenario | OG Cost | USD Cost |
|----------|---------|----------|
| Low | 0.000025 OG | $0.05 |
| Medium | 0.000250 OG | $0.50 |
| High | 0.002500 OG | $5.00 |
| Extreme | 0.025000 OG | $50.00 |

---

## Complete Cost Breakdown (First Year)

### Option A: Ethereum Mainnet

| Cost Item | Amount |
|-----------|--------|
| Smart Contract Deployment | $234 - $390 |
| 1,000 Incidents (Mint + Attest) | $15,000 - $25,000 |
| IPFS/Storage (external) | $100 - $500/year |
| Backend Hosting | $240 - $600/year |
| Domain + SSL | $15/year |
| **TOTAL FIRST YEAR** | **~$15,589 - $26,505** |

### Option B: 0G Network (RECOMMENDED) ✅

| Cost Item | Amount |
|-----------|--------|
| Smart Contract Deployment | **$0.08** |
| 1,000 Incidents (Mint + Attest) | **$5 - $50** |
| 0G Storage (integrated) | **$1 - $10/year** |
| 0G Compute AI (integrated) | **$10 - $100/year** |
| Backend Hosting | $240 - $600/year |
| Domain + SSL | $15/year |
| **TOTAL FIRST YEAR** | **~$271 - $775** |

**💰 TOTAL SAVINGS: $15,318 - $25,730 (98% reduction!)**

---

## Optimization Strategies

### For Ethereum Mainnet:
1. **Deploy during off-peak hours** (weekends, late night UTC)
   - Can save 30-50% on gas costs
2. **Use Flashbots** for MEV protection and better gas prices
3. **Consider L2 solutions:**
   - Arbitrum: 10-20x cheaper
   - Optimism: 10-20x cheaper
   - Base: 10-20x cheaper
4. **Batch operations** where possible
5. **Use proxy patterns** for upgradability (reduces redeployment costs)

### For 0G Network:
1. **Already optimized** - gas is negligible
2. **Native integrations** eliminate external service costs
3. **Leverage full stack:**
   - 0G Storage for logs/metadata
   - 0G Compute for AI inference
   - 0G DA for data availability

---

## Additional Considerations

### 0G Storage Costs
- **Per Incident:** ~$0.001
  - Logs file (~5-50 KB): $0.0005
  - Metadata JSON (~2 KB): $0.0005
- **1,000 incidents:** ~$1

### 0G Compute Costs
- **Per AI Inference:** $0.001 - $0.01
  - Input tokens: ~500 tokens × $0.0000001 = $0.00005
  - Output tokens: ~1000 tokens × $0.0000004 = $0.0004
- **1,000 attestations:** ~$0.50 - $5

### Infrastructure Costs
| Service | Monthly Cost |
|---------|--------------|
| VPS (2GB RAM, 2 vCPU) | $20 - $50 |
| Domain name | $1/month |
| SSL certificate | Free (Let's Encrypt) |
| Monitoring (optional) | $0 - $20 |

---

## Security Considerations

### Smart Contract Audits (Recommended for Mainnet)
| Audit Type | Cost Range |
|------------|------------|
| Automated tools (Slither, Mythril) | Free |
| Community review | $0 - $500 |
| Professional audit (small team) | $5,000 - $15,000 |
| Top-tier audit firm | $20,000 - $100,000+ |

**Note:** For hackathon/testnet deployment, automated tools + community review are sufficient. For mainnet production with significant value, professional audit is recommended.

---

## Deployment Checklist

### Pre-Deployment
- [ ] Compile contracts: `npx hardhat compile`
- [ ] Run tests: `npx hardhat test`
- [ ] Run security scans: `slither .`
- [ ] Check gas optimization
- [ ] Set up deployment wallet with sufficient funds
- [ ] Configure environment variables
- [ ] Backup private keys securely

### Deployment
- [ ] Deploy MockOracle (or use existing oracle)
- [ ] Deploy INFT contract
- [ ] Authorize attestor addresses
- [ ] Verify contracts on explorer
- [ ] Update frontend config with new addresses
- [ ] Test minting on testnet first

### Post-Deployment
- [ ] Monitor initial transactions
- [ ] Set up alerts for contract events
- [ ] Document all addresses
- [ ] Update README with mainnet info
- [ ] Announce deployment

---

## Quick Deploy Commands

### Ethereum Mainnet
```bash
# Set up environment
export PRIVATE_KEY="your_private_key"
export MAINNET_RPC_URL="https://eth-mainnet.g.alchemy.com/v2/YOUR_KEY"

# Compile
npx hardhat compile

# Deploy
npx hardhat run scripts/deployINFT.js --network mainnet

# Verify
npx hardhat verify --network mainnet DEPLOYED_ADDRESS
```

### 0G Mainnet
```bash
# Set up environment
export PRIVATE_KEY="your_private_key"
export OG_RPC_URL="https://evmrpc.0g.ai"  # Update with mainnet RPC

# Deploy
node scripts/deployINFT.js --network og

# Mint test incident
node scripts/mintIncidentINFT.js --network og --address DEPLOYED_ADDRESS
```

---

## Recommendations

### For Hackathon/Demo (Current)
✅ **Stick with 0G Galileo Testnet**
- Zero cost
- Full feature testing
- Perfect for demonstrations

### For Production Launch
✅ **Use 0G Mainnet**
- 99% cheaper than Ethereum
- Native storage/compute integration
- Purpose-built for AI applications
- Better performance
- Lower latency

### If Ethereum Required
⚠️ **Consider L2 First**
- Arbitrum One (most compatible)
- Optimism (good ecosystem)
- Base (growing fast)

All offer 10-100x gas savings vs. mainnet with similar security guarantees.

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Gas price spike | Medium | High | Deploy during off-peak, use gas price oracle |
| Contract bug | Low | Critical | Audit, testing, staged rollout |
| Oracle failure | Low | Medium | Use established oracles, fallback mechanism |
| Storage costs | Low | Low | 0G storage is very cheap, implement archival |
| Network congestion | Medium | Medium | Use proper gas limits, queue system |

---

## ROI Analysis

### Break-even Analysis (vs Ethereum)

If deployed on 0G instead of Ethereum:
- **Upfront savings:** $234 → $0.08 = **$233.92**
- **Per 100 incidents:** $1,500 → $0.50 = **$1,499.50**
- **Break-even:** Immediate (on deployment alone)

At 1,000 incidents/year:
- **Annual savings:** ~$15,000 - $25,000
- **5-year savings:** ~$75,000 - $125,000

---

## Conclusion

**Recommended Deployment Strategy:**
1. ✅ **Deploy on 0G Mainnet** for optimal cost-performance
2. ✅ Use full 0G stack (Storage + Compute + Blockchain)
3. ✅ Budget: <$1,000 for first year including 1,000+ incidents
4. ✅ Reserve Ethereum/L2 only if required by partnerships

**Why 0G is the Clear Winner:**
- 💰 99% cost savings
- 🚀 Native AI/ML capabilities
- 📦 Integrated storage solution
- ⚡ High performance
- 🔮 Purpose-built for Web3 AI applications

---

**Generated:** November 2, 2025  
**Version:** 1.0  
**Project:** iSentinel - Verifiable AI Incident Reporting
