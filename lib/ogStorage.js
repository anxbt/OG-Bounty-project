import "dotenv/config";
import { ZgFile, Indexer } from "@0glabs/0g-ts-sdk";
import { ethers } from "ethers";

class OGStorageManager {
  constructor() {
    this.rpcUrl = process.env.OG_RPC_URL;
    this.privateKey = process.env.PRIVATE_KEY?.startsWith('0x') 
      ? process.env.PRIVATE_KEY 
      : `0x${process.env.PRIVATE_KEY}`;
    this.indexerUrl = process.env.OG_STORAGE_URL || "https://indexer-storage-testnet-turbo.0g.ai";
  }

  async uploadToOG(content, filename) {
    try {
      console.log(`Uploading ${filename} to 0G Storage...`);
      
      // Write content to a temporary file (ZgFile works better with file paths)
      const path = await import('path');
      const fs = await import('fs');
      const os = await import('os');
      
      const tempFile = path.join(os.tmpdir(), `0g-upload-${filename}`);
      fs.writeFileSync(tempFile, content);
      
      // Create ZgFile instance from file path
      const file = await ZgFile.fromFilePath(tempFile);
      
      // Create proper ethers provider and signer
      const provider = new ethers.JsonRpcProvider(this.rpcUrl);
      const signer = new ethers.Wallet(this.privateKey, provider);
      
      // Initialize indexer
      const indexer = new Indexer(this.indexerUrl);
      
      // Upload file to 0G using the correct API
      const [tx, err] = await indexer.upload(file, this.rpcUrl, signer);
      
      if (err) {
        throw new Error(`0G upload failed: ${err.message}`);
      }
      
      // Get the merkle tree to extract root hash
      const [tree, treeErr] = await file.merkleTree();
      if (treeErr) {
        throw new Error(`Failed to get merkle tree: ${treeErr.message}`);
      }
      
      // Generate 0G URI
      const rootHash = tree.rootHash();
      const ogUri = `0g://${rootHash}`;
      
      console.log(`✅ Uploaded ${filename} to 0G Storage: ${ogUri}`);
      console.log(`📄 Transaction: ${tx}`);
      
      await file.close(); // Clean up file resources
      
      // Clean up temp file
      fs.unlinkSync(tempFile);
      
      return {
        uri: ogUri,
        rootHash: rootHash,
        size: content.length,
        filename: filename,
        transaction: tx
      };
      
    } catch (error) {
      console.error(`❌ 0G Storage upload failed for ${filename}:`, error.message);
      
      // Fallback to local storage for development
      console.log(`📁 Falling back to local storage for ${filename}`);
      return this.fallbackToLocal(content, filename);
    }
  }

  async fallbackToLocal(content, filename) {
    // Keep the existing local storage as fallback
    const fs = await import('fs');
    const path = await import('path');
    const { pathToFileURL } = await import('url');
    
    const outDir = path.join(process.cwd(), "out", "storage");
    fs.mkdirSync(outDir, { recursive: true });
    const filePath = path.join(outDir, filename);
    fs.writeFileSync(filePath, content);
    
    return {
      uri: pathToFileURL(filePath).href,
      rootHash: null,
      size: content.length,
      filename: filename,
      fallback: true
    };
  }

  async downloadFromOG(ogUri) {
    try {
      if (!ogUri.startsWith('0g://')) {
        throw new Error('Invalid 0G URI format');
      }
      
      const rootHash = ogUri.replace('0g://', '');
      const indexer = new Indexer(this.indexerUrl);
      
      // Create a temporary output file path for download
      const path = await import('path');
      const os = await import('os');
      const tempFile = path.join(os.tmpdir(), `0g-download-${Date.now()}.tmp`);
      
      // Download file from 0G (returns error only)
      const err = await indexer.download(rootHash, tempFile, false);
      
      if (err) {
        throw new Error(`0G download failed: ${err.message}`);
      }
      
      // Read the downloaded file
      const fs = await import('fs');
      const content = fs.readFileSync(tempFile, 'utf8');
      
      // Clean up temp file
      fs.unlinkSync(tempFile);
      
      return content;
      
    } catch (error) {
      console.error(`❌ 0G Storage download failed for ${ogUri}:`, error.message);
      throw error;
    }
  }

  // Verify file integrity using 0G
  async verifyFile(ogUri, expectedHash) {
    try {
      const content = await this.downloadFromOG(ogUri);
      const actualHash = require('crypto').createHash('sha256').update(content).digest('hex');
      return actualHash === expectedHash;
    } catch (error) {
      console.error(`❌ File verification failed:`, error.message);
      return false;
    }
  }
}

export default OGStorageManager;