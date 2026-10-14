export type Scenario = 'A' | 'B' | 'C' | 'D';
export type NavSection = 'overview' | 'diagnosis' | 'devices' | 'heatmap' | 'history';
export type Band = '2.4GHz' | '5GHz';
export type Priority = 'Critical' | 'High' | 'Normal' | 'Low';
export type SignalStrength = 'Excellent' | 'Good' | 'Fair' | 'Poor';
export type VerificationStatus = 'Improved' | 'Partially Improved' | 'Not Improved';

export interface NetworkMetrics {
  healthScore: number;
  throughput: number;
  latency: number;
  packetLoss: number;
  channelUtilization: number;
  connectedDevices: number;
  band24: number;
  band5: number;
  upstreamStatus: 'healthy' | 'degraded' | 'failed';
}

export interface Device {
  id: string;
  name: string;
  type: 'laptop' | 'smartphone' | 'tv' | 'guest' | 'iot' | 'tablet';
  band: Band;
  signalStrength: SignalStrength;
  rssi: number;
  throughput: number;
  priority: Priority;
  recommendedBand: Band;
  bandAssigned: boolean;
  macAddress: string;
  ipAddress: string;
  manufacturer: string;
}

export interface DiagnosisResult {
  scenario: Scenario;
  symptoms: string[];
  rootCause: string;
  evidence: { metric: string; value: string; threshold: string; status: 'warning' | 'critical' | 'ok' }[];
  confidence: number;
  confidenceExplanation: string;
  recommendedAction: string;
  actionExplanation: string;
  alternativeRejected: string;
  expectedOutcome: string;
}

export interface Room {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  signalLevel: number;
  signalQuality: SignalStrength;
  distanceFromRouter: number;
}

export interface ActionHistoryEntry {
  id: string;
  timestamp: Date;
  scenario: Scenario;
  action: string;
  status: VerificationStatus;
  beforeMetrics: Partial<NetworkMetrics>;
  afterMetrics: Partial<NetworkMetrics>;
  nextStep?: string;
}

export interface SimulationState {
  phase: 'idle' | 'diagnosing' | 'diagnosed' | 'applying' | 'verifying' | 'complete';
  beforeMetrics?: Partial<NetworkMetrics>;
  afterMetrics?: Partial<NetworkMetrics>;
  verificationStatus?: VerificationStatus;
  nextStep?: string;
}
