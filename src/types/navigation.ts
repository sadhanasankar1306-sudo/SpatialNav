export type RiskLevel = 'HIGH_RISK' | 'ELEVATED_RISK' | 'LOWER_DETECTED_RISK' | 'UNKNOWN';

export interface ObstacleCandidate {
  x: number;
  y: number;
  width: number;
  height: number;
  disparity: number;
  areaPixels: number;
  label?: string; // e.g. "Structural Obstacle", "Person", "Furniture"
  confidence: number;
}

export interface RegionAssessment {
  rawDisparityP85: number;       // 85th percentile of raw depth
  obstacleDisparityP85: number;  // Disparity of above-ground obstacle pixels only
  smoothedDisparity: number;     // Multi-frame filtered disparity
  riskLevel: RiskLevel;
  spatialCoverageRatio: number;  // Fraction of region covered by above-ground obstacles
  persistenceFrames: number;     // Consecutive frames obstacle has persisted
  activeReason: string;          // Human-readable diagnostic reason for this state
  candidates: ObstacleCandidate[];
}

export interface RegionalDepthStats {
  left: RegionAssessment;
  center: RegionAssessment;
  right: RegionAssessment;
  timestamp: number;
  overallRisk: RiskLevel;
  primaryDirection: 'NONE' | 'LEFT' | 'CENTER' | 'RIGHT' | 'MULTIPLE';
  pathRecommendation: string;
  isStale: boolean;
  nanRatio: number;
  illuminationLux: number;       // Mean scene luminance (0 to 255)
  motionEnergy: number;          // Inter-frame optical motion diff (0.0 to 1.0)
  floorSlope: number;            // Estimated floor linear regression slope
  floorIntercept: number;        // Estimated floor linear regression intercept
  frameReliability: 'RELIABLE' | 'LOW_LIGHT' | 'EXTREME_GLARE' | 'MOTION_BLUR' | 'STALE_FRAME';
  diagnosticSummary: string;
}

export interface LatencyBreakdown {
  framePreprocessingMs: number;
  modelInferenceMs: number;
  floorSegmentationMs: number;
  spatialClusteringMs: number;
  temporalVerificationMs: number;
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
  baseFrequencyHz: number; // e.g. 280 Hz
  maxFrequencyHz: number; // e.g. 840 Hz
  warningFrequencyRate: number; // 1 to 10
  hapticFeedbackEnabled: boolean;
  alertCooldownMs: number; // Cooldown between non-urgent audio beeps (e.g. 1200ms)
}

export interface NavigationThresholds {
  highRiskEnter: number;        // Default 0.72 (~ <1.2m)
  highRiskExit: number;         // Default 0.60 (Stronger Hysteresis gap: 0.12)
  elevatedRiskEnter: number;    // Default 0.48 (~ 1.2m - 2.5m)
  elevatedRiskExit: number;     // Default 0.38 (Hysteresis gap: 0.10)
  minClusterAreaPixels: number; // Min contiguous obstacle size (default 90px ~ 1.5% region)
  floorMarginThreshold: number; // Obstacle elevation margin above ground plane (default 0.14)
  confirmationFrames: number;   // Frames required to confirm new obstacle (default 3)
  clearingFrames: number;       // Frames required to clear an obstacle warning (default 4)
  emaAlpha: number;             // Temporal filter weight (default 0.30)
  motionBlurThreshold: number;  // Max inter-frame motion diff before flagging UNKNOWN (0.18)
  lowLightThreshold: number;    // Min mean luminance (default 22)
  glareThreshold: number;       // Max mean luminance (default 238)
  staleFrameTimeoutMs: number;  // Max frame interval before timeout (350ms)
}

export interface IndoorChallengeScenario {
  id: string;
  title: string;
  category: string;
  description: string;
  obstacleType:
    | 'EMPTY_CORRIDOR'
    | 'CENTER_PILLAR'
    | 'FURNITURE_CHAIRS'
    | 'CROSSING_PEDESTRIAN'
    | 'SHADOWS_LIGHTING'
    | 'PATTERNED_TILES'
    | 'LOW_LIGHT_BLUR'
    | 'CAMERA_ROTATION'
    | 'NARROW_PASSAGE'
    | 'GLASS_GLARE';
  groundTruthRisk: RiskLevel;
  durationSeconds: number;
  simulatedSpeedMps: number;
}

export interface EvaluationMetricReport {
  testScenario: string;
  condition: string;
  totalFrames: number;
  truePositives: number;
  falsePositives: number;
  falseNegatives: number;
  trueNegatives: number;
  precision: number;
  recall: number;
  f1Score: number;
  falseAlarmsPerMinute: number;
  missedHazardRate: number;
  averageLatencyMs: number;
  processedFps: number;
}

export interface AndroidFileItem {
  path: string;
  category: 'GRADLE' | 'MANIFEST' | 'KOTLIN_SRC' | 'RESOURCES' | 'UNIT_TESTS' | 'DOCS';
  title: string;
  description: string;
  content: string;
}
