export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'UNKNOWN';

export interface RegionalDepthStats {
  left: {
    rawDepth: number; // 0.0 (far) to 1.0 (imminent collision)
    smoothedDepth: number; // EMA filtered
    riskLevel: RiskLevel;
    percentile85: number;
    sampleCount: number;
  };
  center: {
    rawDepth: number;
    smoothedDepth: number;
    riskLevel: RiskLevel;
    percentile85: number;
    sampleCount: number;
  };
  right: {
    rawDepth: number;
    smoothedDepth: number;
    riskLevel: RiskLevel;
    percentile85: number;
    sampleCount: number;
  };
  timestamp: number;
  overallRisk: RiskLevel;
  primaryDirection: 'NONE' | 'LEFT' | 'CENTER' | 'RIGHT' | 'MULTIPLE';
  pathRecommendation: string;
  isStale: boolean;
  nanRatio: number;
}

export interface LatencyBreakdown {
  framePreprocessingMs: number;
  modelInferenceMs: number;
  depthPostprocessingMs: number;
  spatialAudioLatencyMs: number;
  totalEndToEndMs: number;
}

export interface TelemetryData {
  previewFps: number;
  inferenceFps: number;
  latency: LatencyBreakdown;
  droppedFrames: number;
  totalProcessedFrames: number;
  memoryEstimateMb: number;
  cameraStatus: 'ACTIVE' | 'DISCONNECTED' | 'PERMISSION_DENIED' | 'STALE';
  modelDelegate: 'GPU (OpenCL/Vulkan)' | 'NNAPI' | 'CPU (4 Threads)';
}

export interface AudioSettings {
  masterVolume: number; // 0.0 to 1.0
  stereoPanningEnabled: boolean;
  speechGuidanceEnabled: boolean;
  baseFrequencyHz: number; // e.g. 260 Hz
  maxFrequencyHz: number; // e.g. 880 Hz
  warningFrequencyRate: number; // 1 to 10
  hapticFeedbackEnabled: boolean;
}

export interface NavigationThresholds {
  highRiskEnter: number; // Default 0.72 (~ <1.2m)
  highRiskExit: number;  // Default 0.64 (Hysteresis)
  mediumRiskEnter: number; // Default 0.48 (~ 1.2m - 2.5m)
  mediumRiskExit: number;  // Default 0.40 (Hysteresis)
  emaAlpha: number; // 0.35 exponential moving average factor
  floorRejectionRatio: number; // Bottom 20% excluded
  staleFrameTimeoutMs: number; // 350ms
}

export interface IndoorChallengeScenario {
  id: string;
  title: string;
  description: string;
  obstacleType: 'CENTER_PILLAR' | 'LEFT_CHAIR' | 'MOVING_PEDESTRIAN' | 'DOORWAY_HAZARD' | 'GLASS_GLARE';
  durationSeconds: number;
  simulatedSpeedMps: number;
}

export interface AndroidFileItem {
  path: string;
  category: 'GRADLE' | 'MANIFEST' | 'KOTLIN_SRC' | 'RESOURCES' | 'UNIT_TESTS' | 'DOCS';
  title: string;
  description: string;
  content: string;
}
