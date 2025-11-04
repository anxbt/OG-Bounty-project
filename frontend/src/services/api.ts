import { ethers } from 'ethers';
import { Incident, ReportIncidentData, BackendIncidentResponse } from '../types';
import { BACKEND_API_URL, CONTRACT_ADDRESS, RPC_URL, CONTRACT_ABI } from '../constants';

// Create provider for blockchain interactions
const provider = new ethers.JsonRpcProvider(RPC_URL);

// Create contract instance
const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);

// Cache for blockchain data to prevent multiple simultaneous fetches
let blockchainCachePromise: Promise<Incident[]> | null = null;
let blockchainCacheTime: number = 0;
let blockchainCachedData: Incident[] | null = null;
const CACHE_DURATION = 300000; // 5 minutes (increased from 30 seconds)

export const fetchIncidents = async (filters?: {
  severity?: string;
  owner?: string;
}): Promise<Incident[]> => {
  try {
    // First, try to get incidents from backend API
    console.log('🔍 Fetching incidents from backend API...');
    const response = await fetch(`${BACKEND_API_URL}/incidents`);
    if (response.ok) {
      const incidents = await response.json();
      console.log(`📦 Backend returned ${incidents.length} incidents`);
      
      // If backend has incidents, use them
      if (incidents.length > 0) {
        return applyClientFilters(incidents, filters);
      }
      
      // If backend is empty, fall through to blockchain query
      console.log('⚠️ Backend empty, falling back to blockchain...');
    }
  } catch (error) {
    console.warn('❌ Backend API not available, falling back to blockchain data');
  }

  // Use cached promise if a fetch is already in progress or data is still fresh
  if (blockchainCachedData && (Date.now() - blockchainCacheTime) < CACHE_DURATION) {
    console.log('♻️ Using cached blockchain data (no re-fetch)');
    return applyClientFilters(blockchainCachedData, filters);
  }
  
  if (blockchainCachePromise && (Date.now() - blockchainCacheTime) < CACHE_DURATION) {
    console.log('♻️ Using in-progress blockchain fetch...');
    const cachedData = await blockchainCachePromise;
    return applyClientFilters(cachedData, filters);
  }

  // Fallback: Read directly from blockchain
  console.log('🔄 Starting fresh blockchain fetch...');
  blockchainCacheTime = Date.now();
  blockchainCachePromise = fetchIncidentsFromBlockchain();
  
  try {
    const data = await blockchainCachePromise;
    blockchainCachedData = data; // Store in cache
    return applyClientFilters(data, filters);
  } catch (error) {
    blockchainCachePromise = null; // Clear cache on error
    blockchainCachedData = null;
    throw error;
  }
};

// NEW: Progressive fetching with callbacks
export const fetchIncidentsProgressive = async (
  onProgress: (incident: Incident, index: number, total: number) => void,
  filters?: {
    severity?: string;
    owner?: string;
  }
): Promise<Incident[]> => {
  try {
    // Check cache first
    if (blockchainCachedData && (Date.now() - blockchainCacheTime) < CACHE_DURATION) {
      console.log('♻️ Using cached data for progressive display');
      // Emit cached incidents progressively for UI animation
      blockchainCachedData.forEach((inc: Incident, idx: number) => {
        setTimeout(() => {
          onProgress(inc, idx + 1, blockchainCachedData!.length);
        }, idx * 50); // 50ms delay between each for smooth animation
      });
      return applyClientFilters(blockchainCachedData, filters);
    }
    
    // Try backend first (fast path)
    const response = await fetch(`${BACKEND_API_URL}/incidents`);
    if (response.ok) {
      const incidents = await response.json();
      if (incidents.length > 0) {
        // Emit all incidents quickly
        incidents.forEach((inc: Incident, idx: number) => {
          onProgress(inc, idx + 1, incidents.length);
        });
        return applyClientFilters(incidents, filters);
      }
    }
  } catch (error) {
    console.warn('Backend not available, using blockchain...');
  }

  // Blockchain fetch with progress callbacks
  blockchainCacheTime = Date.now();
  blockchainCachePromise = fetchIncidentsFromBlockchain(onProgress);
  const allIncidents = await blockchainCachePromise;
  blockchainCachedData = allIncidents; // Cache the result
  return applyClientFilters(allIncidents, filters);
};

// Helper function to fetch incidents directly from blockchain events
const fetchIncidentsFromBlockchain = async (
  onProgress?: (incident: Incident, index: number, total: number) => void
): Promise<Incident[]> => {
  try {
    console.log('📡 [START] Fetching incidents from blockchain...');
    const startTime = Date.now();
    
    // For iNFT contract, we need to query Transfer events (minting)
    // Transfer from address(0) indicates minting
    const filter = contract.filters.Transfer(ethers.ZeroAddress, null, null);
    
    // Query from contract deployment block (Oct 14, 2025: block ~2286000) to catch ALL NFTs
    // This is more efficient than querying -700k blocks
    const DEPLOYMENT_BLOCK = 2286000; // iNFT contract deployed around this block
    console.log(`🔍 Querying from deployment block ${DEPLOYMENT_BLOCK} to latest...`);
    const events = await contract.queryFilter(filter, DEPLOYMENT_BLOCK);
    
    console.log(`✅ Found ${events.length} Transfer (mint) events`);
    
    const incidents: Incident[] = [];
    const totalEvents = events.length;
    
    for (let i = 0; i < events.length; i++) {
      const event = events[events.length - 1 - i]; // Reverse to get newest first
      
      if ('args' in event && event.args) {
        const [, , tokenId] = event.args;
        
        console.log(`Processing tokenId ${tokenId}... (${i + 1}/${totalEvents})`);
        
        // Try to get metadata from the contract
        let incidentTitle = `Incident #${tokenId}`;
        let incidentDescription = 'AI incident detected';
        let incidentLogs = 'Log data stored off-chain';
        let incidentSeverity: 'info' | 'warning' | 'critical' = 'info';
        
        // Get block timestamp and owner in parallel
        const [block, owner, encryptedURI, tokenURI] = await Promise.all([
          event.getBlock(),
          contract.ownerOf(tokenId).catch(() => null),
          contract.getEncryptedURI(tokenId).catch(() => null),
          contract.tokenURI(tokenId).catch(() => null)
        ]);
        
        try {
          const uri = encryptedURI || tokenURI;
          
          if (uri) {
            console.log(`📄 Token ${tokenId} URI:`, uri.substring(0, 60) + '...');
            
            // Try to fetch metadata
            if (uri.startsWith('0g://')) {
              // 0G storage - use backend to download
              try {
                const response = await fetch(`${BACKEND_API_URL}/download?uri=${encodeURIComponent(uri)}`);
                if (response.ok) {
                  const data = await response.json();
                  if (data.ok && data.content) {
                    const metadata = JSON.parse(data.content);
                    console.log(`   ✅ Fetched metadata for token ${tokenId}:`, metadata.name);
                    
                    // Extract title and description from metadata
                    incidentTitle = metadata.name || metadata.title || incidentTitle;
                    incidentDescription = metadata.description || incidentDescription;
                    
                    // Map severity string to enum
                    if (metadata.severity) {
                      if (metadata.severity === 'critical' || metadata.severity === 2) {
                        incidentSeverity = 'critical';
                      } else if (metadata.severity === 'warning' || metadata.severity === 1) {
                        incidentSeverity = 'warning';
                      } else {
                        incidentSeverity = 'info';
                      }
                    }
                    
                    // Check if logs are embedded or in a separate URI
                    if (metadata.logs) {
                      // Logs are embedded in metadata
                      incidentLogs = metadata.logs;
                    } else if (metadata.logUri && metadata.logUri.startsWith('0g://')) {
                      // Logs are in a separate 0G Storage file
                      console.log(`   📥 Downloading logs from: ${metadata.logUri.substring(0, 50)}...`);
                      try {
                        const logsResponse = await fetch(`${BACKEND_API_URL}/download?uri=${encodeURIComponent(metadata.logUri)}`);
                        if (logsResponse.ok) {
                          const logsData = await logsResponse.json();
                          if (logsData.ok && logsData.content) {
                            incidentLogs = logsData.content;
                            console.log(`   ✅ Downloaded logs (${logsData.content.length} bytes)`);
                          }
                        }
                      } catch (logsErr) {
                        console.warn(`   ⚠️ Failed to download logs for token ${tokenId}:`, logsErr);
                      }
                    }
                  }
                }
              } catch (err) {
                console.warn(`Failed to fetch from 0G storage for token ${tokenId}:`, err);
              }
            }
          }
        } catch (metadataError) {
          console.warn(`Could not fetch metadata for token ${tokenId}:`, metadataError);
        }
        
        const blockTimestamp = new Date(block.timestamp * 1000).toISOString();
        
        const incident: Incident = {
          id: `incident-${tokenId}`,
          severity: incidentSeverity,
          timestamp: blockTimestamp,
          token_id: Number(tokenId),
          title: incidentTitle,
          description: incidentDescription,
          logs: incidentLogs,
          tx_hash: event.transactionHash,
          log_hash: '',
          owner: owner,
          created_at: blockTimestamp
        };
        
        console.log(`✅ Created incident object:`, {
          tokenId: incident.token_id,
          title: incident.title,
          descriptionLength: incident.description.length,
          logsLength: incident.logs.length
        });
        
        incidents.push(incident);
        
        // Call progress callback to enable progressive rendering
        if (onProgress) {
          onProgress(incident, i + 1, totalEvents);
        }
      }
    }
    
    console.log(`✅ Fetched ${incidents.length} incidents from blockchain`);
    console.log(`⏱️ [COMPLETE] Blockchain fetch took ${Date.now() - startTime}ms`);
    
    return incidents;
  } catch (error) {
    console.error('❌ [ERROR] Error fetching blockchain incidents:', error);
    return [];
  }
};

// Helper function to apply filters client-side
const applyClientFilters = (incidents: Incident[], filters?: { severity?: string; owner?: string }) => {
  let filtered = [...incidents];
  
  if (filters?.severity && filters.severity !== 'all') {
    filtered = filtered.filter(i => i.severity === filters.severity);
  }
  
  if (filters?.owner) {
    filtered = filtered.filter(i => i.owner?.toLowerCase() === filters.owner?.toLowerCase());
  }
  
  return filtered;
};

export const reportIncident = async (data: ReportIncidentData): Promise<{ success: boolean; message: string; incident?: Incident }> => {
  try {
    const response = await fetch(`${BACKEND_API_URL}/incident`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: data.title,
        description: data.description,
        severity: data.severity,
        logs: data.logs || 'No logs provided',
        // Add any additional metadata
        metadata: {
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString(),
          url: window.location.href
        }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Backend error: ${response.status} ${errorText}`);
    }

    const result: BackendIncidentResponse = await response.json();
    
    if (result.success) {
      // Convert backend response to frontend Incident format
      const incident: Incident = {
        id: result.incidentId || 'pending',
        severity: data.severity,
        timestamp: new Date().toISOString(),
        token_id: result.tokenId || null,
        title: data.title,
        description: data.description,
        logs: data.logs || 'No logs provided',
        tx_hash: result.txHash || null,
        log_hash: result.logHash || null,
        owner: null,
        created_at: new Date().toISOString()
      };

      return {
        success: true,
        message: result.message || 'Incident reported successfully!',
        incident
      };
    } else {
      return {
        success: false,
        message: result.message || 'Failed to report incident'
      };
    }
  } catch (error) {
    console.error('Error reporting incident:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Network error occurred'
    };
  }
};

export const getIncidentStats = async (): Promise<{
  total: number;
  critical: number;
  recent: number;
}> => {
  try {
    // Try backend API first
    const response = await fetch(`${BACKEND_API_URL}/stats`);
    if (response.ok) {
      return await response.json();
    }
  } catch (error) {
    console.warn('Backend stats API not available, calculating from blockchain');
  }

  // Fallback: calculate from incidents
  const incidents = await fetchIncidents();
  
  const now = new Date();
  const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  const stats = {
    total: incidents.length,
    critical: incidents.filter((i) => i.severity === 'critical').length,
    recent: incidents.filter((i) => new Date(i.timestamp) >= twentyFourHoursAgo).length,
  };

  return stats;
};

// Helper function to get user's owned incidents
export const fetchUserIncidents = async (userAddress: string): Promise<Incident[]> => {
  try {
    console.log(`🔍 Fetching incidents for user: ${userAddress}`);
    
    // Fetch ALL incidents once (this includes full metadata from 0G storage)
    const allIncidents = await fetchIncidentsFromBlockchain();
    console.log(`📦 Total incidents fetched: ${allIncidents.length}`);
    
    // Filter to only incidents owned by this user
    const userIncidents = allIncidents.filter(incident => 
      incident.owner?.toLowerCase() === userAddress.toLowerCase()
    );
    
    console.log(`✅ User owns ${userIncidents.length} incident(s)`);
    
    return userIncidents.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  } catch (error) {
    console.error('❌ Error fetching user incidents:', error);
    return [];
  }
};
