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
    title: 'Center Structural Pillar',
    description: 'Imminent collision course with a solid structural concrete pillar in the central walking path.',
    obstacleType: 'CENTER_PILLAR',
    durationSeconds: 12,
    simulatedSpeedMps: 1.1,
  },
  {
    id: 'sc-2',
    title: 'Left Office Chair & Waste Bin',
    description: 'Peripheral hazard protruding into the corridor from the left side.',
    obstacleType: 'LEFT_CHAIR',
    durationSeconds: 10,
    simulatedSpeedMps: 0.9,
  },
  {
    id: 'sc-3',
    title: 'Moving Crossing Pedestrian',
    description: 'Dynamic pedestrian walking across the corridor from right to left.',
    obstacleType: 'MOVING_PEDESTRIAN',
    durationSeconds: 14,
    simulatedSpeedMps: 1.3,
  },
  {
    id: 'sc-4',
    title: 'Doorway & Low Header',
    description: 'Narrow doorframe entrance with protruding jambs and restricted headroom.',
    obstacleType: 'DOORWAY_HAZARD',
    durationSeconds: 8,
    simulatedSpeedMps: 0.8,
  },
  {
    id: 'sc-5',
    title: 'Specular Glass Wall (Fail-Safe)',
    description: 'Monocular depth failure simulation due to high reflection, testing the UNKNOWN fail-safe.',
    obstacleType: 'GLASS_GLARE',
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
  });

  // Algorithm thresholds
  const [thresholds, setThresholds] = useState<NavigationThresholds>({
    highRiskEnter: 0.72,
    highRiskExit: 0.64,
    mediumRiskEnter: 0.48,
    mediumRiskExit: 0.40,
    emaAlpha: 0.35,
    floorRejectionRatio: 0.20,
    staleFrameTimeoutMs: 350,
  });

  // Live stats
  const [stats, setStats] = useState<RegionalDepthStats>({
    left: { rawDepth: 0.12, smoothedDepth: 0.12, riskLevel: 'LOW', percentile85: 0.12, sampleCount: 1800 },
    center: { rawDepth: 0.15, smoothedDepth: 0.15, riskLevel: 'LOW', percentile85: 0.15, sampleCount: 1800 },
    right: { rawDepth: 0.11, smoothedDepth: 0.11, riskLevel: 'LOW', percentile85: 0.11, sampleCount: 1800 },
    timestamp: Date.now(),
    overallRisk: 'LOW',
    primaryDirection: 'NONE',
    pathRecommendation: 'System ready. Press Start Navigation to begin scanning.',
    isStale: false,
    nanRatio: 0,
  });

  // Telemetry metrics
  const [telemetry, setTelemetry] = useState<TelemetryData>({
    previewFps: 30.0,
    inferenceFps: 28.5,
    latency: {
      framePreprocessingMs: 4.8,
      modelInferenceMs: 24.2,
      depthPostprocessingMs: 3.5,
      spatialAudioLatencyMs: 2.1,
      totalEndToEndMs: 34.6,
    },
    droppedFrames: 0,
    totalProcessedFrames: 420,
    memoryEstimateMb: 142,
    cameraStatus: 'ACTIVE',
    modelDelegate: 'GPU (OpenCL/Vulkan)',
  });

  // Callback when a new depth frame is calculated
  const handleDepthFrameCalculated = useCallback(
    (newStats: RegionalDepthStats, _depthMap: Float32Array, inferenceMs: number) => {
      setStats(newStats);

      setTelemetry((prev) => {
        const total = 4.8 + inferenceMs + 3.5 + 2.1;
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
      } else if (['1', '2', '3', '4', '5'].includes(e.key)) {
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
