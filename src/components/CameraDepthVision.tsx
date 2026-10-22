import React, { useRef, useEffect, useState } from 'react';
import { Camera, Video, AlertCircle, RefreshCw, Layers, ShieldCheck, Sliders, Sun, Wind } from 'lucide-react';
import { IndoorChallengeScenario, NavigationThresholds, RegionalDepthStats, TelemetryData } from '../types/navigation';
import { depthEngine } from '../services/depthEstimationEngine';

interface CameraDepthVisionProps {
  useLiveCamera: boolean;
  onToggleLiveCamera: (enable: boolean) => void;
  selectedScenario: IndoorChallengeScenario;
  onSelectScenario: (scenario: IndoorChallengeScenario) => void;
  allScenarios: IndoorChallengeScenario[];
  thresholds: NavigationThresholds;
  onUpdateThresholds: (thresholds: NavigationThresholds) => void;
  stats: RegionalDepthStats;
  telemetry: TelemetryData;
  onDepthFrameCalculated: (stats: RegionalDepthStats, depthMap: Float32Array, latencyMs: number) => void;
}

export const CameraDepthVision: React.FC<CameraDepthVisionProps> = ({
  useLiveCamera,
  onToggleLiveCamera,
  selectedScenario,
  onSelectScenario,
  allScenarios,
  thresholds,
  onUpdateThresholds,
  stats,
  telemetry,
  onDepthFrameCalculated,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const depthCanvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const [colormapMode, setColormapMode] = useState<'TURBO' | 'MAGMA' | 'GRAYSCALE'>('TURBO');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [elapsedScenarioMs, setElapsedScenarioMs] = useState<number>(0);
  const [challengeDescription, setChallengeDescription] = useState<string>('');
  const [showAdvancedTuning, setShowAdvancedTuning] = useState<boolean>(false);

  // Setup Live Camera or Synthetic Scenario loop
  useEffect(() => {
    let active = true;

    if (useLiveCamera) {
      navigator.mediaDevices
        ?.getUserMedia({
          video: {
            facingMode: facingMode,
            width: { ideal: 640 },
            height: { ideal: 480 },
          },
        })
        .then((stream) => {
          if (!active) {
            stream.getTracks().forEach((track) => track.stop());
            return;
          }
          streamRef.current = stream;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.play().catch(() => {});
          }
          setCameraError(null);
        })
        .catch((err) => {
          setCameraError(`Camera permission denied or camera unavailable: ${err.message}`);
          onToggleLiveCamera(false);
        });
    } else {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    }

    return () => {
      active = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, [useLiveCamera, facingMode]);

  // Main rendering & depth estimation loop
  useEffect(() => {
    let lastTime = performance.now();

    const processLoop = () => {
      const now = performance.now();
      const delta = now - lastTime;
      lastTime = now;

      if (useLiveCamera && videoRef.current && videoRef.current.readyState >= 2) {
        const video = videoRef.current;
        const offCanvas = document.createElement('canvas');
        offCanvas.width = 256;
        offCanvas.height = 256;
        const ctx = offCanvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0, 256, 256);
          const imgData = ctx.getImageData(0, 0, 256, 256);
          const result = depthEngine.estimateDepthFromImageData(imgData, thresholds);

          onDepthFrameCalculated(result.stats, result.depthMap, result.inferenceTimeMs);

          if (depthCanvasRef.current) {
            depthEngine.renderColormapToCanvas(
              depthCanvasRef.current,
              result.depthMap,
              result.stats,
              thresholds,
              colormapMode
            );
          }
        }
      } else if (!useLiveCamera) {
        setElapsedScenarioMs((prev) => {
          const next = prev + delta;
          const result = depthEngine.generateChallengeFrame(selectedScenario, next, thresholds);

          onDepthFrameCalculated(result.stats, result.depthMap, result.inferenceTimeMs);
          setChallengeDescription(result.challengeDescription);

          if (depthCanvasRef.current) {
            depthEngine.renderColormapToCanvas(
              depthCanvasRef.current,
              result.depthMap,
              result.stats,
              thresholds,
              colormapMode
            );
          }
          return next;
        });
      }

      animationFrameRef.current = requestAnimationFrame(processLoop);
    };

    animationFrameRef.current = requestAnimationFrame(processLoop);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [useLiveCamera, selectedScenario, thresholds, colormapMode]);

  return (
    <div className="space-y-6">
      {/* Input Mode Selector Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-[#12161f] p-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => onToggleLiveCamera(false)}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all ${
              !useLiveCamera
                ? 'bg-yellow-400 text-slate-950 shadow-sm'
                : 'bg-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            <Layers className="h-4 w-4" />
            <span>Standard Indoor Benchmarks</span>
          </button>

          <button
            onClick={() => onToggleLiveCamera(true)}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all ${
              useLiveCamera
                ? 'bg-yellow-400 text-slate-950 shadow-sm'
                : 'bg-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            <Camera className="h-4 w-4" />
            <span>Live Device Camera</span>
          </button>
        </div>

        {useLiveCamera && (
          <button
            onClick={() => setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'))}
            className="flex items-center gap-2 rounded-lg bg-slate-800 px-3 py-1.5 text-xs text-slate-300 hover:text-white"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Switch Lens ({facingMode === 'environment' ? 'Back' : 'Front'})</span>
          </button>
        )}

        {/* Colormap visual selector */}
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span>Depth Palette:</span>
          {(['TURBO', 'MAGMA', 'GRAYSCALE'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setColormapMode(mode)}
              className={`px-2.5 py-1 rounded text-xs font-semibold ${
                colormapMode === mode ? 'bg-slate-700 text-white' : 'bg-slate-900 text-slate-400 hover:text-slate-200'
              }`}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      {cameraError && (
        <div className="rounded-xl border border-rose-500/40 bg-rose-950/20 p-4 text-xs text-rose-300 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-rose-400 shrink-0" />
          <span>{cameraError}. Reverted to Controlled Indoor Challenge Scenarios.</span>
        </div>
      )}

      {/* Controlled Indoor Challenge Scenario Selectors */}
      {!useLiveCamera && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400 px-1">
            <span className="font-semibold uppercase tracking-wider">Evaluation Testbed Scenarios</span>
            <span>{challengeDescription}</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
            {allScenarios.map((sc) => (
              <button
                key={sc.id}
                onClick={() => {
                  onSelectScenario(sc);
                  setElapsedScenarioMs(0);
                }}
                className={`p-3 rounded-xl border text-left transition-all ${
                  selectedScenario.id === sc.id
                    ? 'border-yellow-400 bg-yellow-400/10 text-yellow-300 ring-2 ring-yellow-400/30'
                    : 'border-slate-800 bg-[#12161f] text-slate-400 hover:text-white'
                }`}
              >
                <div className="text-xs font-bold text-white truncate">{sc.title}</div>
                <div className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">{sc.category}</div>
                <div className="text-[10px] opacity-70 mt-1 line-clamp-2">{sc.description}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Dual Screen Display: Camera View & Estimated Depth Map */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Screen 1: Camera Feed / Testbed Scenario Input */}
        <div className="rounded-2xl border border-slate-800 bg-[#12161f] p-4 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <Video className="h-4 w-4 text-yellow-400" />
              <span className="font-bold text-white">Input Video Frame (CameraX Ingestion)</span>
            </div>
            <span className="font-mono text-slate-400 tabular-nums">
              Preview: {telemetry.previewFps.toFixed(0)} FPS
            </span>
          </div>

          <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-black flex items-center justify-center border border-slate-800">
            {useLiveCamera ? (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full relative flex flex-col items-center justify-center p-6 text-center bg-gradient-to-b from-slate-900 to-black">
                <div className="text-sm font-semibold text-slate-200">{selectedScenario.title}</div>
                <div className="text-xs text-slate-400 mt-2 max-w-xs">{selectedScenario.description}</div>
                <div className="mt-4 px-3 py-1 rounded-full bg-slate-800 text-[11px] font-mono text-yellow-400">
                  Target Ground Truth: {selectedScenario.groundTruthRisk}
                </div>
              </div>
            )}

            {/* Region Division Guides */}
            <div className="absolute inset-0 pointer-events-none grid grid-cols-3 border border-white/10">
              <div className="border-r border-white/20 flex items-start justify-center pt-2">
                <span className="bg-black/60 px-2 py-0.5 rounded text-[10px] text-white/70">Left Zone</span>
              </div>
              <div className="border-r border-white/20 flex items-start justify-center pt-2">
                <span className="bg-black/60 px-2 py-0.5 rounded text-[10px] text-white/70">Center Zone</span>
              </div>
              <div className="flex items-start justify-center pt-2">
                <span className="bg-black/60 px-2 py-0.5 rounded text-[10px] text-white/70">Right Zone</span>
              </div>
            </div>
          </div>
        </div>

        {/* Screen 2: Real-Time Depth Map & Floor Subtraction Overlay */}
        <div className="rounded-2xl border border-slate-800 bg-[#12161f] p-4 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-cyan-400" />
              <span className="font-bold text-white">Floor-Subtracted Depth &amp; Obstacle Clusters</span>
            </div>
            <span className="font-mono text-cyan-400 tabular-nums">
              Inference: {telemetry.inferenceFps.toFixed(0)} FPS ({telemetry.latency.totalEndToEndMs.toFixed(1)} ms)
            </span>
          </div>

          <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-black flex items-center justify-center border border-slate-800">
            <canvas ref={depthCanvasRef} className="w-full h-full object-cover" />

            {/* Diagnostic Legend Overlay */}
            <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between bg-black/85 px-3 py-1.5 rounded-lg text-[10px] font-mono text-white/90">
              <span className="text-cyan-400">--- Floor Baseline</span>
              <span className="text-rose-400">&#9633; Obstacle Cluster BBox</span>
              <span className="text-emerald-400">&#10003; 3-Frame Confirmed</span>
            </div>
          </div>
        </div>
      </div>

      {/* Threshold & Calibration Controls */}
      <div className="rounded-2xl border border-slate-800 bg-[#12161f] p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-300">
            Pipeline Calibration &amp; Temporal Tuning
          </div>
          <button
            onClick={() => setShowAdvancedTuning(!showAdvancedTuning)}
            className="flex items-center gap-1.5 text-xs text-yellow-400 hover:text-yellow-300 font-semibold"
          >
            <Sliders className="h-3.5 w-3.5" />
            <span>{showAdvancedTuning ? 'Hide Advanced' : 'Show Advanced'}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-xs text-slate-400">
          <div>
            <div className="flex justify-between mb-1.5">
              <span>High Risk Threshold (&tau;_enter):</span>
              <span className="font-mono text-white">{thresholds.highRiskEnter.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0.60"
              max="0.88"
              step="0.02"
              value={thresholds.highRiskEnter}
              onChange={(e) =>
                onUpdateThresholds({
                  ...thresholds,
                  highRiskEnter: parseFloat(e.target.value),
                  highRiskExit: parseFloat(e.target.value) - 0.12,
                })
              }
              className="accent-yellow-400 w-full cursor-pointer"
            />
            <div className="text-[10px] text-slate-500 mt-1">
              Hysteresis Exit: {thresholds.highRiskExit.toFixed(2)} (&Delta; = 0.12)
            </div>
          </div>

          <div>
            <div className="flex justify-between mb-1.5">
              <span>Elevated Risk Threshold (&tau;_enter):</span>
              <span className="font-mono text-white">{thresholds.elevatedRiskEnter.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0.35"
              max="0.60"
              step="0.02"
              value={thresholds.elevatedRiskEnter}
              onChange={(e) =>
                onUpdateThresholds({
                  ...thresholds,
                  elevatedRiskEnter: parseFloat(e.target.value),
                  elevatedRiskExit: parseFloat(e.target.value) - 0.10,
                })
              }
              className="accent-yellow-400 w-full cursor-pointer"
            />
            <div className="text-[10px] text-slate-500 mt-1">
              Hysteresis Exit: {thresholds.elevatedRiskExit.toFixed(2)} (&Delta; = 0.10)
            </div>
          </div>

          <div>
            <div className="flex justify-between mb-1.5">
              <span>Floor Elevation Margin:</span>
              <span className="font-mono text-white">{thresholds.floorMarginThreshold.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0.06"
              max="0.25"
              step="0.01"
              value={thresholds.floorMarginThreshold}
              onChange={(e) =>
                onUpdateThresholds({
                  ...thresholds,
                  floorMarginThreshold: parseFloat(e.target.value),
                })
              }
              className="accent-yellow-400 w-full cursor-pointer"
            />
            <div className="text-[10px] text-slate-500 mt-1">
              Minimum height above floor to qualify as obstacle
            </div>
          </div>
        </div>

        {showAdvancedTuning && (
          <div className="pt-4 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-6 text-xs text-slate-400">
            <div>
              <div className="flex justify-between mb-1.5">
                <span>Confirmation Frames (M-of-5):</span>
                <span className="font-mono text-white">{thresholds.confirmationFrames} frames</span>
              </div>
              <input
                type="range"
                min="1"
                max="5"
                step="1"
                value={thresholds.confirmationFrames}
                onChange={(e) =>
                  onUpdateThresholds({ ...thresholds, confirmationFrames: parseInt(e.target.value, 10) })
                }
                className="accent-yellow-400 w-full cursor-pointer"
              />
              <div className="text-[10px] text-slate-500 mt-1">
                Frames required before issuing ordinary alert
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-1.5">
                <span>Clearing Frames:</span>
                <span className="font-mono text-white">{thresholds.clearingFrames} frames</span>
              </div>
              <input
                type="range"
                min="2"
                max="8"
                step="1"
                value={thresholds.clearingFrames}
                onChange={(e) =>
                  onUpdateThresholds({ ...thresholds, clearingFrames: parseInt(e.target.value, 10) })
                }
                className="accent-yellow-400 w-full cursor-pointer"
              />
              <div className="text-[10px] text-slate-500 mt-1">
                Consecutive clear frames before lowering alert
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-1.5">
                <span>Min Cluster Area:</span>
                <span className="font-mono text-white">{thresholds.minClusterAreaPixels} px</span>
              </div>
              <input
                type="range"
                min="40"
                max="250"
                step="10"
                value={thresholds.minClusterAreaPixels}
                onChange={(e) =>
                  onUpdateThresholds({ ...thresholds, minClusterAreaPixels: parseInt(e.target.value, 10) })
                }
                className="accent-yellow-400 w-full cursor-pointer"
              />
              <div className="text-[10px] text-slate-500 mt-1">
                Rejects small isolated noise specs below this area
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
