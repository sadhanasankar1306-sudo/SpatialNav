import React from 'react';
import { Play, Square, VolumeX, ShieldAlert, Headphones, Radio, AlertTriangle } from 'lucide-react';
import { RegionalDepthStats, RiskLevel, AudioSettings } from '../types/navigation';

interface NavigationDashboardProps {
  isNavigating: boolean;
  onToggleNavigation: () => void;
  onEmergencyStopAudio: () => void;
  stats: RegionalDepthStats;
  audioSettings: AudioSettings;
  onUpdateAudioSettings: (settings: AudioSettings) => void;
  isHighContrast: boolean;
  lastSpokenPhrase: string;
}

export const NavigationDashboard: React.FC<NavigationDashboardProps> = ({
  isNavigating,
  onToggleNavigation,
  onEmergencyStopAudio,
  stats,
  audioSettings,
  onUpdateAudioSettings,
  isHighContrast,
  lastSpokenPhrase,
}) => {
  const getRiskColor = (level: RiskLevel) => {
    switch (level) {
      case 'HIGH':
        return 'bg-rose-600 text-white border-rose-500';
      case 'MEDIUM':
        return 'bg-amber-500 text-slate-950 border-amber-400 font-semibold';
      case 'UNKNOWN':
        return 'bg-purple-600 text-white border-purple-400';
      case 'LOW':
      default:
        return 'bg-emerald-900/40 text-emerald-300 border-emerald-500/40';
    }
  };

  const getRiskLabel = (level: RiskLevel) => {
    switch (level) {
      case 'HIGH':
        return 'CLOSE HAZARD';
      case 'MEDIUM':
        return 'APPROACHING';
      case 'UNKNOWN':
        return 'UNCERTAIN';
      case 'LOW':
      default:
        return 'CLEAR PATH';
    }
  };

  // Compute stereo channel volume indicators for visualizer
  const leftVol = stats.left.riskLevel === 'HIGH' ? 95 : stats.left.riskLevel === 'MEDIUM' ? 60 : 15;
  const rightVol = stats.right.riskLevel === 'HIGH' ? 95 : stats.right.riskLevel === 'MEDIUM' ? 60 : 15;
  const centerVol = stats.center.riskLevel === 'HIGH' ? 100 : stats.center.riskLevel === 'MEDIUM' ? 65 : 10;

  return (
    <div className="space-y-6">
      {/* Accessibility Live Region for Screen Readers / TalkBack */}
      <div
        role="alert"
        aria-live="assertive"
        className="sr-only"
        aria-atomic="true"
      >
        {isNavigating
          ? `${stats.pathRecommendation}. Left: ${stats.left.riskLevel}. Center: ${stats.center.riskLevel}. Right: ${stats.right.riskLevel}.`
          : 'Navigation stopped.'}
      </div>

      {/* Mandatory Safety Research Disclaimer Banner */}
      <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/10 p-4 text-xs text-yellow-200">
        <div className="flex items-start gap-3">
          <ShieldAlert className="h-5 w-5 shrink-0 text-yellow-400 mt-0.5" />
          <div>
            <span className="font-bold tracking-wide">RESEARCH PROTOTYPE NOTICE: </span>
            This system is an experimental assistive research tool. It is <strong>NOT</strong> a certified mobility device
            and must <strong>NEVER</strong> replace a white cane, guide dog, or Orientation &amp; Mobility (O&amp;M) training.
            Monocular depth estimation does not reliably detect glass, descending stairs, or drop-offs.
          </div>
        </div>
      </div>

      {/* Primary Action Button Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <button
          onClick={onToggleNavigation}
          className={`sm:col-span-2 h-20 rounded-2xl flex items-center justify-center gap-4 text-xl font-extrabold tracking-wide shadow-lg transition-transform active:scale-[0.98] ${
            isNavigating
              ? 'bg-rose-600 hover:bg-rose-500 text-white ring-4 ring-rose-500/30'
              : 'bg-yellow-400 hover:bg-yellow-300 text-slate-950 ring-4 ring-yellow-400/20'
          }`}
          aria-label={isNavigating ? 'Stop spatial obstacle scanning' : 'Start spatial obstacle scanning'}
        >
          {isNavigating ? (
            <>
              <Square className="h-7 w-7 fill-current" />
              <span>STOP NAVIGATION</span>
            </>
          ) : (
            <>
              <Play className="h-7 w-7 fill-current" />
              <span>START NAVIGATION</span>
            </>
          )}
        </button>

        <button
          onClick={onEmergencyStopAudio}
          className="h-20 rounded-2xl bg-slate-900 border-2 border-rose-500/60 hover:bg-rose-950/40 text-rose-300 hover:text-white flex items-center justify-center gap-3 text-base font-bold transition-all"
          aria-label="Immediate Stop Audio - silence all stereo beeps"
        >
          <VolumeX className="h-6 w-6 text-rose-400" />
          <span>STOP AUDIO</span>
        </button>
      </div>

      {/* Current Real-Time Advisory Callout */}
      <div
        className={`rounded-2xl p-6 border transition-all ${
          stats.overallRisk === 'HIGH'
            ? 'border-rose-500/60 bg-rose-950/30'
            : stats.overallRisk === 'MEDIUM'
            ? 'border-amber-500/50 bg-amber-950/20'
            : stats.overallRisk === 'UNKNOWN'
            ? 'border-purple-500/60 bg-purple-950/30'
            : 'border-slate-800 bg-[#12161f]'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Real-Time Path Advisory
            </div>
            <div className="text-xl sm:text-2xl font-bold text-white mt-1">
              {stats.pathRecommendation}
            </div>
          </div>
          {lastSpokenPhrase && (
            <div className="shrink-0 flex items-center gap-2 rounded-lg bg-slate-800/80 px-3 py-1.5 border border-slate-700 text-xs text-yellow-300">
              <Radio className="h-3.5 w-3.5 animate-pulse" />
              <span>Spoken: &ldquo;{lastSpokenPhrase}&rdquo;</span>
            </div>
          )}
        </div>
      </div>

      {/* Directional Obstacle Corridor Matrix (Left, Center, Right) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-slate-400 px-1">
          <span className="font-semibold uppercase tracking-wider">Corridor Zone Analysis</span>
          <span>EMA Filter: &alpha; = 0.35 &middot; 85th Percentile Disparity</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* LEFT ZONE */}
          <div
            className={`rounded-2xl p-5 border transition-all ${getRiskColor(
              stats.left.riskLevel
            )}`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider">Left Zone</span>
              <span className="text-xs font-black px-2 py-0.5 rounded bg-black/20">
                {getRiskLabel(stats.left.riskLevel)}
              </span>
            </div>
            <div className="mt-3 text-3xl font-extrabold font-mono tabular-nums">
              {(stats.left.smoothedDepth * 100).toFixed(0)}%
            </div>
            <div className="mt-2 text-xs opacity-80 flex items-center justify-between">
              <span>Raw: {(stats.left.rawDepth * 100).toFixed(0)}%</span>
              <span>Stereo Pan: -0.85 (Left)</span>
            </div>
            {/* Visual proximity bar */}
            <div className="mt-3 h-2 w-full bg-black/30 rounded-full overflow-hidden">
              <div
                className="h-full bg-current transition-all duration-150"
                style={{ width: `${Math.min(100, stats.left.smoothedDepth * 100)}%` }}
              />
            </div>
          </div>

          {/* CENTER ZONE */}
          <div
            className={`rounded-2xl p-5 border transition-all ${getRiskColor(
              stats.center.riskLevel
            )}`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider">Center Zone</span>
              <span className="text-xs font-black px-2 py-0.5 rounded bg-black/20">
                {getRiskLabel(stats.center.riskLevel)}
              </span>
            </div>
            <div className="mt-3 text-3xl font-extrabold font-mono tabular-nums">
              {(stats.center.smoothedDepth * 100).toFixed(0)}%
            </div>
            <div className="mt-2 text-xs opacity-80 flex items-center justify-between">
              <span>Raw: {(stats.center.rawDepth * 100).toFixed(0)}%</span>
              <span>Stereo Pan: 0.0 (Binaural)</span>
            </div>
            {/* Visual proximity bar */}
            <div className="mt-3 h-2 w-full bg-black/30 rounded-full overflow-hidden">
              <div
                className="h-full bg-current transition-all duration-150"
                style={{ width: `${Math.min(100, stats.center.smoothedDepth * 100)}%` }}
              />
            </div>
          </div>

          {/* RIGHT ZONE */}
          <div
            className={`rounded-2xl p-5 border transition-all ${getRiskColor(
              stats.right.riskLevel
            )}`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider">Right Zone</span>
              <span className="text-xs font-black px-2 py-0.5 rounded bg-black/20">
                {getRiskLabel(stats.right.riskLevel)}
              </span>
            </div>
            <div className="mt-3 text-3xl font-extrabold font-mono tabular-nums">
              {(stats.right.smoothedDepth * 100).toFixed(0)}%
            </div>
            <div className="mt-2 text-xs opacity-80 flex items-center justify-between">
              <span>Raw: {(stats.right.rawDepth * 100).toFixed(0)}%</span>
              <span>Stereo Pan: +0.85 (Right)</span>
            </div>
            {/* Visual proximity bar */}
            <div className="mt-3 h-2 w-full bg-black/30 rounded-full overflow-hidden">
              <div
                className="h-full bg-current transition-all duration-150"
                style={{ width: `${Math.min(100, stats.right.smoothedDepth * 100)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Stereo Audio Feedback Visualizer */}
      <div className="rounded-2xl border border-slate-800 bg-[#12161f] p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Headphones className="h-5 w-5 text-yellow-400" />
            <span className="text-sm font-bold text-white">Spatial Audio Output Visualizer</span>
          </div>
          <span className="text-xs text-slate-400">
            {isNavigating ? 'Audio Engine Active' : 'Audio Engine Standby'}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-6">
          {/* Left Headphone Ear Channel */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-slate-400">
              <span className="font-semibold text-slate-300">Left Ear (L Channel)</span>
              <span className="font-mono tabular-nums">{leftVol}% Gain</span>
            </div>
            <div className="h-6 w-full bg-slate-900 rounded-lg p-1 border border-slate-800">
              <div
                className={`h-full rounded transition-all duration-100 ${
                  stats.left.riskLevel === 'HIGH' ? 'bg-rose-500' : stats.left.riskLevel === 'MEDIUM' ? 'bg-amber-400' : 'bg-slate-700'
                }`}
                style={{ width: `${isNavigating ? leftVol : 0}%` }}
              />
            </div>
          </div>

          {/* Right Headphone Ear Channel */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-slate-400">
              <span className="font-semibold text-slate-300">Right Ear (R Channel)</span>
              <span className="font-mono tabular-nums">{rightVol}% Gain</span>
            </div>
            <div className="h-6 w-full bg-slate-900 rounded-lg p-1 border border-slate-800">
              <div
                className={`h-full rounded transition-all duration-100 ${
                  stats.right.riskLevel === 'HIGH' ? 'bg-rose-500' : stats.right.riskLevel === 'MEDIUM' ? 'bg-amber-400' : 'bg-slate-700'
                }`}
                style={{ width: `${isNavigating ? rightVol : 0}%` }}
              />
            </div>
          </div>
        </div>

        {/* Volume & Frequency settings */}
        <div className="mt-6 pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-400">
          <div className="flex items-center gap-3">
            <span>Audio Volume:</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={audioSettings.masterVolume}
              onChange={(e) =>
                onUpdateAudioSettings({ ...audioSettings, masterVolume: parseFloat(e.target.value) })
              }
              className="accent-yellow-400 w-32 cursor-pointer"
              aria-label="Master audio volume"
            />
            <span className="font-mono text-white">{Math.round(audioSettings.masterVolume * 100)}%</span>
          </div>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={audioSettings.speechGuidanceEnabled}
                onChange={(e) =>
                  onUpdateAudioSettings({
                    ...audioSettings,
                    speechGuidanceEnabled: e.target.checked,
                  })
                }
                className="accent-yellow-400 rounded cursor-pointer"
              />
              <span className="text-slate-300">Spoken Guidance</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={audioSettings.stereoPanningEnabled}
                onChange={(e) =>
                  onUpdateAudioSettings({
                    ...audioSettings,
                    stereoPanningEnabled: e.target.checked,
                  })
                }
                className="accent-yellow-400 rounded cursor-pointer"
              />
              <span className="text-slate-300">Binaural 3D Panning</span>
            </label>
          </div>
        </div>
      </div>

      {/* Keyboard Shortcuts for Accessibility & Screen Readers */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 text-xs text-slate-400 flex flex-wrap items-center justify-between gap-3">
        <span className="font-medium text-slate-300">Quick Keyboard Access:</span>
        <div className="flex flex-wrap gap-3 font-mono">
          <span><kbd className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-yellow-300">Space</kbd> Start / Stop</span>
          <span><kbd className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-yellow-300">M</kbd> Mute Audio</span>
          <span><kbd className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-yellow-300">1 - 5</kbd> Test Scenarios</span>
        </div>
      </div>
    </div>
  );
};
