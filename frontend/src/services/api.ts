import { ethers } from 'ethers';
import { Incident, ReportIncidentData, BackendIncidentResponse, SeverityType } from '../types';
import { BACKEND_API_URL, CONTRACT_ADDRESS, RPC_URL, CONTRACT_ABI } from '../constants';

// Create provider for blockchain interactions
const provider = new ethers.JsonRpcProvider(RPC_URL);

// Create contract instance
const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);

export const fetchIncidents = async (filters?: {
  severity?: string;
  owner?: string;
}): Promise<Incident[]> => {
  try {
    // First, try to get incidents from backend API
    const response = await fetch(`${BACKEND_API_URL}/incidents`);
    if (response.ok) {
      const incidents = await response.json();
      const normalizedIncidents = Array.isArray(incidents)
        ? incidents.map(normalizeBackendIncident)
        : [];
      return applyClientFilters(normalizedIncidents, filters);
    }
  } catch (error) {
    console.warn('Backend API not available, falling back to blockchain data');
  }

  // Fallback: Read directly from blockchain
  return await fetchIncidentsFromBlockchain(filters);
};

interface BackendIncident {
  incidentId?: string;
  id?: string;
  tokenId?: number | string;
  token_id?: number | string;
  title?: string;
  description?: string;
  logs?: unknown;
  severity?: string | number;
  timestamp?: string | number;
  created_at?: string | number;
  txHash?: string;
  tx_hash?: string;
  logHash?: string;
  log_hash?: string;
  owner?: string;
  ai_model?: string | null;
  aiModel?: string | null;
  ai_version?: string | null;
  aiVersion?: string | null;
}

const normalizeBackendIncident = (incident: BackendIncident): Incident => {
  const resolveSeverity = (value: any): SeverityType => {
    if (typeof value === 'string') {
      const lower = value.toLowerCase();
      if (lower === 'critical' || lower === 'warning' || lower === 'info') {
        return lower as SeverityType;
      }
    }

    if (typeof value === 'number') {
      const mapping: SeverityType[] = ['info', 'warning', 'critical'];
      return mapping[value] ?? 'info';
    }

    return 'info';
  };

  const toIsoString = (value: string | number | Date | undefined): string => {
    if (value instanceof Date) {
      return Number.isNaN(value.getTime()) ? new Date().toISOString() : value.toISOString();
    }

    const date = value !== undefined ? new Date(value) : new Date();
    return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
  };

  const timestampSource = incident?.timestamp ?? incident?.created_at ?? Date.now();
  const timestamp = toIsoString(timestampSource);

  const createdAt = incident?.created_at ? toIsoString(incident.created_at) : timestamp;

  const rawTokenId = incident?.token_id ?? incident?.tokenId;
  const parsedTokenId =
    rawTokenId === undefined || rawTokenId === null || rawTokenId === ''
      ? null
      : Number(rawTokenId);
  const tokenId = Number.isNaN(parsedTokenId) ? null : parsedTokenId;

  const logsValue = incident?.logs;
  const logs =
    typeof logsValue === 'string'
      ? logsValue
      : logsValue
      ? JSON.stringify(logsValue, null, 2)
      : 'No logs available';

  return {
    id: String(
      incident?.incidentId ||
        incident?.id ||
        (tokenId !== null ? `token-${tokenId}` : `incident-${timestampSource}`)
    ),
    severity: resolveSeverity(incident?.severity),
    timestamp,
    token_id: tokenId,
    title: incident?.title ?? 'Untitled Incident',
    description:
      typeof incident?.description === 'string'
        ? incident.description
        : incident?.description
        ? JSON.stringify(incident.description, null, 2)
        : 'No description provided.',
    logs,
    tx_hash: incident?.txHash ?? incident?.tx_hash ?? null,
    log_hash: incident?.logHash ?? incident?.log_hash ?? null,
    owner: incident?.owner ?? null,
    ai_model: incident?.ai_model ?? incident?.aiModel ?? null,
    ai_version: incident?.ai_version ?? incident?.aiVersion ?? null,
    created_at: createdAt,
  };
};

// Helper function to fetch incidents directly from blockchain events
const fetchIncidentsFromBlockchain = async (filters?: {
  severity?: string;
  owner?: string;
}): Promise<Incident[]> => {
  try {
    // Get IncidentMinted events from the contract
    const filter = contract.filters.IncidentMinted();
    const events = await contract.queryFilter(filter, -1000); // Last 1k blocks for faster loading
    
    const incidents: Incident[] = [];
    
    for (const event of events.reverse()) { // Reverse to get newest first
      if ('args' in event && event.args) {
        const [tokenId, incidentId, logHash, severity, tokenURI, timestamp] = event.args;
        
        // Try to fetch metadata from tokenURI
        let title = `Incident ${incidentId}`;
        let description = 'AI incident detected';
        let logs = 'Log data stored off-chain';
        
        try {
          if (tokenURI.startsWith('0g://')) {
            // For 0G storage, we'd need to implement download
            title = `AI Incident ${incidentId}`;
            description = 'Incident stored on 0G Storage';
          } else if (tokenURI.startsWith('file://')) {
            // Local file - try to read it
            const response = await fetch(tokenURI);
            if (response.ok) {
              const metadata = await response.json();
              title = metadata.name || title;
              description = metadata.description || description;
            }
          }
        } catch (metadataError) {
          console.warn('Could not fetch metadata:', metadataError);
        }
        
        const incident: Incident = {
          id: incidentId,
          severity: ['info', 'warning', 'critical'][severity] as any,
          timestamp: new Date(Number(timestamp) * 1000).toISOString(),
          token_id: Number(tokenId),
          title,
          description,
          logs,
          tx_hash: event.transactionHash,
          log_hash: logHash,
          owner: null, // Would need to call contract.ownerOf(tokenId) for this
          created_at: new Date(Number(timestamp) * 1000).toISOString()
        };
        
        incidents.push(incident);
      }
    }
    
    return applyClientFilters(incidents, filters);
  } catch (error) {
    console.error('Error fetching blockchain incidents:', error);
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
    // Since the contract doesn't implement ERC721Enumerable, we need to use events
    // to find tokens owned by the user
    const transferFilter = contract.filters.Transfer(null, userAddress);
    const transferEvents = await contract.queryFilter(transferFilter, -10000); // Last 10k blocks
    
    const ownedTokenIds = new Set<number>();
    
    // Process Transfer events to find currently owned tokens
    for (const event of transferEvents) {
      if ('args' in event && event.args) {
        const [_from, to, tokenId] = event.args;
        if (to.toLowerCase() === userAddress.toLowerCase()) {
          ownedTokenIds.add(Number(tokenId));
        }
      }
    }
    
    // Also check for any transfers away from the user
    const transferAwayFilter = contract.filters.Transfer(userAddress);
    const transferAwayEvents = await contract.queryFilter(transferAwayFilter, -10000);
    
    for (const event of transferAwayEvents) {
      if ('args' in event && event.args) {
        const [from, _to, tokenId] = event.args;
        if (from.toLowerCase() === userAddress.toLowerCase()) {
          ownedTokenIds.delete(Number(tokenId));
        }
      }
    }
    
    const incidents: Incident[] = [];
    
    // Get incident data for each owned token
    for (const tokenId of ownedTokenIds) {
      try {
        // Verify current ownership (in case events are out of sync)
        const currentOwner = await contract.ownerOf(tokenId);
        if (currentOwner.toLowerCase() !== userAddress.toLowerCase()) {
          continue; // Skip if no longer owned
        }
        
        const [incidentStruct, _tokenURI] = await contract.getIncident(tokenId);
        
        // Try to get full incident data from backend first
        let incident: Incident = {
          id: incidentStruct.incidentId,
          severity: ['info', 'warning', 'critical'][incidentStruct.severity] as any,
          timestamp: new Date(Number(incidentStruct.timestamp) * 1000).toISOString(),
          token_id: Number(tokenId),
          title: `Incident ${incidentStruct.incidentId}`,
          description: 'User-owned incident NFT',
          logs: 'Log data stored off-chain',
          tx_hash: null,
          log_hash: incidentStruct.logHash,
          owner: userAddress,
          created_at: new Date(Number(incidentStruct.timestamp) * 1000).toISOString()
        };
        
        // Try to fetch full incident data from backend
        try {
          console.log('Fetching incidents from backend...');
          const response = await fetch(`${BACKEND_API_URL}/incidents`);
          console.log('Backend response status:', response.status);
          if (response.ok) {
            const backendIncidents = await response.json();
            console.log('Backend incidents:', backendIncidents);
            const matchingIncident = backendIncidents.find((bi: any) => 
              bi.incidentId === incidentStruct.incidentId || 
              bi.tokenId === Number(tokenId)
            );
            
            if (matchingIncident) {
              console.log('Found matching incident:', matchingIncident);
              incident = {
                ...incident,
                title: matchingIncident.title || incident.title,
                description: matchingIncident.description || incident.description,
                logs: matchingIncident.logs || incident.logs,
                ai_model: matchingIncident.ai_model,
                ai_version: matchingIncident.ai_version
              };
            } else {
              console.log('No matching incident found for:', incidentStruct.incidentId);
            }
          } else {
            console.warn('Backend returned non-OK status:', response.status);
          }
        } catch (backendError) {
          console.warn('Could not fetch from backend:', backendError);
        }
        
        incidents.push(incident);
      } catch (tokenError) {
        console.warn('Error fetching token data for token', tokenId, ':', tokenError);
      }
    }
    
    return incidents.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  } catch (error) {
    console.error('Error fetching user incidents:', error);
    return [];
  }
};
