export type MatchType = 
  | 'ExactSigned'
  | 'PublisherAndFileName'
  | 'KnownPathAndFileName'
  | 'KnownExecutableName'
  | 'GenericCategory'
  | 'Unknown';

export type ClosePolicy = 'UserApplication' | 'CautionRequired' | 'ProtectedSystem';

export type RecommendationLevel = 'Green' | 'Yellow' | 'Red' | 'Unknown';

export interface Rule {
  id: string;
  matchType: MatchType;
  publisher: string;
  fileName: string;
  path?: string;
  displayName: string;
  category: string;
  closePolicy: ClosePolicy;
  impact: string;
  priority: number;
}

export interface RulesConfig {
  version: string;
  identities: Rule[];
}

export interface ProcessSnapshot {
  processId: number;
  creationTime: string; // ISO timestamp
  name: string;
  executablePath: string;
  workingSetBytes: number;
  privateBytes: number;
  cpuPercent: number;
  parentProcessId?: number;
  owner?: string;
  mainWindowHandle?: number;
  collectedAt: string;
  isProtected?: boolean;
  isSystemLocation?: boolean;
  isAccessDenied?: boolean;
}

export type SignatureStatus = 'Valid' | 'Invalid' | 'Unsigned' | 'UnableToVerify';

export interface ProcessIdentity {
  executablePath: string;
  publisher: string;
  signatureStatus: SignatureStatus;
  isMicrosoftSigned: boolean;
  isSystemLocation: boolean;
  isProtected: boolean;
  applicationName: string;
  category: string;
  confidence: 'High' | 'Medium' | 'Low';
  matchedRuleId?: string;
}

export interface Recommendation {
  level: RecommendationLevel;
  canClose: boolean;
  canForceTerminate: boolean;
  explanation: string;
  consequence: string;
  evidence: string[];
}

export interface GroupedApplication {
  id: string;
  displayName: string;
  publisher: string;
  category: string;
  processCount: number;
  totalWorkingSetBytes: number;
  totalPrivateBytes: number;
  totalCpuPercent: number;
  processes: ProcessSnapshot[];
  identity: ProcessIdentity;
  recommendation: Recommendation;
  confidence: 'High' | 'Medium' | 'Low';
  mainProcess: ProcessSnapshot;
}

export interface PerformanceMetrics {
  startupMs: number;
  enumerationMs: number;
  groupingMs: number;
  ruleLookupMs: number;
  signatureMs: number;
  totalSnapshotMs: number;
  peakWorkingSetMb: number;
  processCount: number;
  topKCount: number;
  timestamp: string;
}

export interface ActionTarget {
  processId: number;
  creationTime: string;
  executablePath: string;
  applicationId: string;
  forceTerminate?: boolean;
}

export interface ActionResult {
  success: boolean;
  targetPid: number;
  action: 'GracefulClose' | 'ForceTerminate';
  message: string;
  revalidationPassed: boolean;
  isPidReused?: boolean;
  code?: 'SUCCESS' | 'PID_REUSED' | 'PROCESS_NOT_FOUND' | 'ACCESS_DENIED' | 'PROTECTED_PROCESS';
  details?: string;
}

export interface MilestoneItem {
  id: number;
  name: string;
  goal: string;
  deliverables: string[];
  done: boolean;
  verificationCriteria: string;
  testOutput?: string;
}

export interface SystemConfig {
  display: {
    maxItems: number;
    showSystemProcesses: boolean;
  };
  behavior: {
    confirmForceTerminate: boolean;
  };
  performance: {
    enrichmentConcurrency: number;
  };
}
