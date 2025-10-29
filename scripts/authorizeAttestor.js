import hre from "hardhat";
import { ethers } from "ethers";
import dotenv from 'dotenv';

dotenv.config();

async function main() {
    console.log('🔐 Authorizing attestor for VISA feature...\n');

    // Setup provider and wallet
    const provider = new ethers.JsonRpcProvider(process.env.OG_RPC_URL);
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
    
    console.log('Contract address:', process.env.INFT_ADDRESS);
    console.log('Attestor address:', wallet.address);

    // Load contract ABI
    const INFT = await hre.artifacts.readArtifact("INFT");
    const contract = new ethers.Contract(
        process.env.INFT_ADDRESS,
        INFT.abi,
        wallet
    );

    // Authorize the wallet as an attestor
    console.log('\nSending transaction to authorize attestor...');
    const tx = await contract.setAttestor(wallet.address, true);
    console.log('Transaction hash:', tx.hash);
    
    console.log('Waiting for confirmation...');
    await tx.wait();
    
    console.log('✅ Attestor authorized successfully!');
    
    // Verify
    const isAuthorized = await contract.authorizedAttestors(wallet.address);
    console.log('\nVerification:', isAuthorized ? '✅ Authorized' : '❌ Not authorized');
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
