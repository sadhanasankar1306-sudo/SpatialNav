import React, { useState, useEffect, useCallback } from 'react';
import { AccessibleHeader } from './components/AccessibleHeader';
import { NavigationDashboard } from './components/NavigationDashboard';
import { CameraDepthVision } from './components/CameraDepthVision';
import { AndroidCodeWorkbench } from './components/AndroidCodeWorkbench';
import { ResearchBenchmarks } from './components/ResearchBenchmarks';
import { AutomatedTestSuite } from './components/AutomatedTestSuite';
import {
  RegionalDepthStats,
  TelemetryData,
  AudioSettings,
  NavigationThresholds,
  IndoorChallengeScenario,
} from './types/navigation';
import { spatialAudio } from './services/spatialAudioEngine';

const DEFAULT_SCENARIOS: IndoorChallengeScenario[] = [
  {
    id: 'sc-1',
    title: 'Empty Corridor & Open Floor',
    category: 'False Alarm Immunity',
    description: 'Unobstructed polished linoleum corridor. Tests ground plane subtraction to ensure zero false obstacle alerts.',
    obstacleType: 'EMPTY_CORRIDOR',
    groundTruthRisk: 'LOWER_DETECTED_RISK',
    durationSeconds: 10,
    simulatedSpeedMps: 1.0,
  },
  {
    id: 'sc-2',
    title: 'Patterned Checkerboard Tiles',
    category: 'Texture Invariance',
    description: 'High-contrast black-and-white tiled floor with specular wax reflections. Tests immunity to 2D surface markings.',
    obstacleType: 'PATTERNED_TILES',
    groundTruthRisk: 'LOWER_DETECTED_RISK',
    durationSeconds: 10,
    simulatedSpeedMps: 1.0,
  },
  {
    id: 'sc-3',
    title: 'Shadows & Lighting Bands',
    category: 'Shadow Invariance',
    description: 'Sharp shadow bands cast across floor by window sunlight. Tests decoupling of dark luminance from disparity.',
    obstacleType: 'SHADOWS_LIGHTING',
    groundTruthRisk: 'LOWER_DETECTED_RISK',
    durationSeconds: 8,
    simulatedSpeedMps: 1.0,
  },
  {
    id: 'sc-4',
    title: 'Center Structural Pillar',
    category: 'Collision Detection',
    description: 'Direct collision course with a solid architectural pillar in the central walking corridor.',
    obstacleType: 'CENTER_PILLAR',
    groundTruthRisk: 'HIGH_RISK',
    durationSeconds: 12,
    simulatedSpeedMps: 1.1,
  },
  {
    id: 'sc-5',
    title: 'Office Chairs & Furniture',
    category: 'Clutter Detection',
    description: 'Protruding chair and waste bin blocking the left side of the corridor.',
    obstacleType: 'FURNITURE_CHAIRS',
    groundTruthRisk: 'ELEVATED_RISK',
    durationSeconds: 10,
    simulatedSpeedMps: 0.9,
  },
  {
    id: 'sc-6',
    title: 'Crossing Moving Pedestrian',
    category: 'Dynamic Obstacles',
    description: 'Walking person traversing diagonally across field of view from right to left.',
    obstacleType: 'CROSSING_PEDESTRIAN',
    groundTruthRisk: 'HIGH_RISK',
    durationSeconds: 14,
    simulatedSpeedMps: 1.3,
  },
  {
    id: 'sc-7',
    title: 'Low Light (<18 lux) & Blur',
    category: 'Sensor Fail-Safe',
    description: 'Extremely dark corridor (<18 lux) causing high sensor noise. Enforces UNKNOWN fail-safe.',
    obstacleType: 'LOW_LIGHT_BLUR',
    groundTruthRisk: 'UNKNOWN',
    durationSeconds: 6,
    simulatedSpeedMps: 0.8,
  },
  {
    id: 'sc-8',
    title: 'Rapid Camera Rotation',
    category: 'Motion Robustness',
    description: 'Sweeping left-right head rotation generating optical motion blur. Pauses alert updates.',
    obstacleType: 'CAMERA_ROTATION',
    groundTruthRisk: 'UNKNOWN',
    durationSeconds: 6,
    simulatedSpeedMps: 1.2,
  },
  {
    id: 'sc-9',
    title: 'Narrow Passage Doorway',
    category: 'Clearance Guidance',
    description: 'Narrow 80cm doorway entrance requiring centered alignment between door jambs.',
    obstacleType: 'NARROW_PASSAGE',
    groundTruthRisk: 'ELEVATED_RISK',
    durationSeconds: 9,
    simulatedSpeedMps: 0.8,
  },
  {
    id: 'sc-10',
    title: 'Floor Glass Wall (Specular)',
    category: 'Sensor Fail-Safe',
    description: 'Specular transparent glass panel resulting in infinite depth. Triggers explicit UNKNOWN caution.',
    obstacleType: 'GLASS_GLARE',
    groundTruthRisk: 'UNKNOWN',
    durationSeconds: 6,
    simulatedSpeedMps: 1.0,
  },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<'nav' | 'vision' | 'code' | 'research' | 'tests'>('nav');
  const [isNavigating, setIsNavigating] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isHighContrast, setIsHighContrast] = useState<boolean>(false);
  const [useLiveCamera, setUseLiveCamera] = useState<boolean>(false);
  const [selectedScenario, setSelectedScenario] = useState<IndoorChallengeScenario>(DEFAULT_SCENARIOS[0]);
  const [lastSpokenPhrase, setLastSpokenPhrase] = useState<string>('');

  // Audio settings
  const [audioSettings, setAudioSettings] = useState<AudioSettings>({
    masterVolume: 0.65,
    stereoPanningEnabled: true,
    speechGuidanceEnabled: true,
    baseFrequencyHz: 280,
    maxFrequencyHz: 840,
    warningFrequencyRate: 6,
    hapticFeedbackEnabled: true,
    alertCooldownMs: 1100,
  });

  // Algorithm thresholds
  const [thresholds, setThresholds] = useState<NavigationThresholds>({
    highRiskEnter: 0.72,
    highRiskExit: 0.60,
    elevatedRiskEnter: 0.48,
    elevatedRiskExit: 0.38,
    minClusterAreaPixels: 90,
    floorMarginThreshold: 0.14,
    confirmationFrames: 3,
    clearingFrames: 4,
    emaAlpha: 0.30,
    motionBlurThreshold: 0.18,
    lowLightThreshold: 22,
    glareThreshold: 238,
    staleFrameTimeoutMs: 350,
  });

  // Initial regional stats with 4-state taxonomy
  const [stats, setStats] = useState<RegionalDepthStats>({
    left: {
      rawDisparityP85: 0.10,
      obstacleDisparityP85: 0,
      smoothedDisparity: 0,
      riskLevel: 'LOWER_DETECTED_RISK',
      spatialCoverageRatio: 0,
      persistenceFrames: 0,
      activeReason: 'Ground plane verified; no elevated obstacle.',
      candidates: [],
    },
    center: {
      rawDisparityP85: 0.12,
      obstacleDisparityP85: 0,
      smoothedDisparity: 0,
      riskLevel: 'LOWER_DETECTED_RISK',
      spatialCoverageRatio: 0,
      persistenceFrames: 0,
      activeReason: 'Ground plane verified; no elevated obstacle.',
      candidates: [],
    },
    right: {
      rawDisparityP85: 0.09,
      obstacleDisparityP85: 0,
      smoothedDisparity: 0,
      riskLevel: 'LOWER_DETECTED_RISK',
      spatialCoverageRatio: 0,
      persistenceFrames: 0,
      activeReason: 'Ground plane verified; no elevated obstacle.',
      candidates: [],
    },
    timestamp: Date.now(),
    overallRisk: 'LOWER_DETECTED_RISK',
    primaryDirection: 'NONE',
    pathRecommendation: 'Forward corridor clear of near obstacles. Maintain white cane awareness.',
    isStale: false,
    nanRatio: 0,
    illuminationLux: 135,
    motionEnergy: 0.02,
    floorSlope: 0.0021,
    floorIntercept: 0.11,
    frameReliability: 'RELIABLE',
    diagnosticSummary: 'Floor slope 0.0021. Low risk across all corridors.',
  });

  // Telemetry metrics
  const [telemetry, setTelemetry] = useState<TelemetryData>({
    previewFps: 30.0,
    inferenceFps: 28.5,
    latency: {
      framePreprocessingMs: 4.2,
      modelInferenceMs: 22.8,
      floorSegmentationMs: 2.8,
      spatialClusteringMs: 3.1,
      temporalVerificationMs: 1.7,
      spatialAudioLatencyMs: 1.8,
      totalEndToEndMs: 36.4,
    },
    droppedFrames: 0,
    totalProcessedFrames: 512,
    memoryEstimateMb: 142,
    cameraStatus: 'ACTIVE',
    modelDelegate: 'GPU (OpenCL/Vulkan)',
  });

  // Callback when a new depth frame is calculated
  const handleDepthFrameCalculated = useCallback(
    (newStats: RegionalDepthStats, _depthMap: Float32Array, inferenceMs: number) => {
      setStats(newStats);

      setTelemetry((prev) => {
        const total = 4.2 + inferenceMs + 2.8 + 3.1 + 1.7 + 1.8;
        return {
          ...prev,
          inferenceFps: Math.max(10, Math.min(32, 1000 / Math.max(16, total))),
          latency: {
            ...prev.latency,
            modelInferenceMs: inferenceMs,
            totalEndToEndMs: total,
          },
          totalProcessedFrames: prev.totalProcessedFrames + 1,
        };
      });

      // Emit audio if navigation is active
      if (isNavigating) {
        spatialAudio.processNavigationFrame(newStats, audioSettings, (phrase) => {
          setLastSpokenPhrase(phrase);
        });
      }
    },
    [isNavigating, audioSettings]
  );

  // Toggle navigation
  const handleToggleNavigation = () => {
    const nextState = !isNavigating;
    setIsNavigating(nextState);

    if (nextState) {
      spatialAudio.setMute(false);
      spatialAudio.speakGuidance('Spatial navigation active. Scanning corridor.', (phrase) => {
        setLastSpokenPhrase(phrase);
      });
    } else {
      spatialAudio.stopAll();
      spatialAudio.speakGuidance('Spatial navigation stopped.', (phrase) => {
        setLastSpokenPhrase(phrase);
      });
    }
  };

  // Immediate emergency stop audio
  const handleEmergencyStopAudio = () => {
    spatialAudio.stopAll();
    setIsMuted(true);
  };

  // Toggle mute
  const handleToggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    spatialAudio.setMute(nextMuted);
  };

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (e.code === 'Space') {
        e.preventDefault();
        handleToggleNavigation();
      } else if (e.key === 'm' || e.key === 'M') {
        handleToggleMute();
      } else if (['1', '2', '3', '4', '5', '6', '7', '8', '9'].includes(e.key)) {
        const idx = parseInt(e.key, 10) - 1;
        if (DEFAULT_SCENARIOS[idx]) {
          setSelectedScenario(DEFAULT_SCENARIOS[idx]);
          setUseLiveCamera(false);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isNavigating, isMuted]);

  return (
    <div className={`min-h-screen bg-[#0c0f14] text-slate-100 ${isHighContrast ? 'contrast-125' : ''}`}>
      {/* Accessible Header */}
      <AccessibleHeader
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
        isHighContrast={isHighContrast}
        onToggleHighContrast={() => setIsHighContrast(!isHighContrast)}
        speechEnabled={audioSettings.speechGuidanceEnabled}
        onToggleSpeech={() =>
          setAudioSettings((prev) => ({
            ...prev,
            speechGuidanceEnabled: !prev.speechGuidanceEnabled,
          }))
        }
      />

      {/* Main Content Viewport */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 py-6 sm:py-8">
        {activeTab === 'nav' && (
          <NavigationDashboard
            isNavigating={isNavigating}
            onToggleNavigation={handleToggleNavigation}
            onEmergencyStopAudio={handleEmergencyStopAudio}
            stats={stats}
            audioSettings={audioSettings}
            onUpdateAudioSettings={setAudioSettings}
            isHighContrast={isHighContrast}
            lastSpokenPhrase={lastSpokenPhrase}
          />
        )}

        {activeTab === 'vision' && (
          <CameraDepthVision
            useLiveCamera={useLiveCamera}
            onToggleLiveCamera={setUseLiveCamera}
            selectedScenario={selectedScenario}
            onSelectScenario={setSelectedScenario}
            allScenarios={DEFAULT_SCENARIOS}
            thresholds={thresholds}
            onUpdateThresholds={setThresholds}
            stats={stats}
            telemetry={telemetry}
            onDepthFrameCalculated={handleDepthFrameCalculated}
          />
        )}

        {activeTab === 'code' && <AndroidCodeWorkbench />}

        {activeTab === 'research' && <ResearchBenchmarks telemetry={telemetry} />}

        {activeTab === 'tests' && <AutomatedTestSuite />}
      </main>
    </div>
  );
}
