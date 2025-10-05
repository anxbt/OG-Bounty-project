export type SeverityType = 'critical' | 'warning' | 'info';

export interface Incident {
  id: string;
  severity: SeverityType;
  timestamp: string;
  token_id: number | null;
  title: string;
  description: string;
  logs: string;
  tx_hash: string | null;
  log_hash: string | null;
  owner: string | null;
  ai_model?: string | null;
  ai_version?: string | null;
  created_at: string;
}

export interface ReportIncidentData {
  title: string;
  severity: SeverityType;
  description: string;
  logs: string;
  ai_model?: string;
  ai_version?: string;
}

export interface BackendIncidentResponse {
  success: boolean;
  message?: string;
  incidentId?: string;
  tokenId?: number;
  txHash?: string;
  logHash?: string;
  error?: string;
}
