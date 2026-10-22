import React from 'react';
import { Play, Square, VolumeX, ShieldAlert, Headphones, Radio, AlertTriangle, Eye, Sun, Wind, Activity } from 'lucide-react';
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
      case 'HIGH_RISK':
        return 'bg-rose-950/80 text-rose-100 border-rose-500 shadow-rose-950/40';
      case 'ELEVATED_RISK':
        return 'bg-amber-950/80 text-amber-100 border-amber-400 shadow-amber-950/40';
      case 'UNKNOWN':
        return 'bg-purple-950/80 text-purple-100 border-purple-400 shadow-purple-950/40';
      case 'LOWER_DETECTED_RISK':
      default:
        return 'bg-emerald-950/40 text-emerald-200 border-emerald-500/40';
    }
  };

  const getRiskBadge = (level: RiskLevel) => {
    switch (level) {
      case 'HIGH_RISK':
        return { label: 'HIGH RISK', bg: 'bg-rose-600 text-white' };
      case 'ELEVATED_RISK':
        return { label: 'ELEVATED RISK', bg: 'bg-amber-500 text-slate-950 font-bold' };
      case 'UNKNOWN':
        return { label: 'UNKNOWN / UNRELIABLE', bg: 'bg-purple-600 text-white' };
      case 'LOWER_DETECTED_RISK':
      default:
        return { label: 'LOWER DETECTED RISK', bg: 'bg-emerald-600/60 text-emerald-100' };
    }
  };

  // Compute stereo channel volume indicators for visualizer
  const leftVol = stats.left.riskLevel === 'HIGH_RISK' ? 100 : stats.left.riskLevel === 'ELEVATED_RISK' ? 55 : 0;
  const rightVol = stats.right.riskLevel === 'HIGH_RISK' ? 100 : stats.right.riskLevel === 'ELEVATED_RISK' ? 55 : 0;

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
          ? `${stats.pathRecommendation} Left: ${stats.left.riskLevel}. Center: ${stats.center.riskLevel}. Right: ${stats.right.riskLevel}.`
          : 'Navigation stopped.'}
      </div>

      {/* Mandatory Safety Research Disclaimer Banner */}
      <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/10 p-4 text-xs text-yellow-200">
        <div className="flex items-start gap-3">
          <ShieldAlert className="h-5 w-5 shrink-0 text-yellow-400 mt-0.5" />
          <div>
            <span className="font-bold tracking-wide">RESEARCH PROTOTYPE DIRECTIVE: </span>
            This application is an experimental perceptual tool and <strong>NOT</strong> a certified mobility aid.
            It must <strong>NEVER</strong> replace a white cane, guide dog, or Orientation &amp; Mobility (O&amp;M) instruction.
            Monocular depth estimation does not reliably detect glass panels, transparent doors, or floor drop-offs (stairs, curbs).
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
          stats.overallRisk === 'HIGH_RISK'
            ? 'border-rose-500/60 bg-rose-950/40'
            : stats.overallRisk === 'ELEVATED_RISK'
            ? 'border-amber-500/50 bg-amber-950/30'
            : stats.overallRisk === 'UNKNOWN'
            ? 'border-purple-500/60 bg-purple-950/40'
            : 'border-slate-800 bg-[#12161f]'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
              <span>Path Advisory</span>
              <span className="text-slate-600">&middot;</span>
              <span className="font-mono text-yellow-400">{getRiskBadge(stats.overallRisk).label}</span>
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

        {/* Environmental Quality Metrics */}
        <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-wrap items-center gap-4 text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <Sun className="h-3.5 w-3.5 text-yellow-400" />
            <span>Illumination: <strong className="text-white font-mono">{stats.illuminationLux.toFixed(0)} lux</strong></span>
          </div>
          <div className="flex items-center gap-1.5">
            <Wind className="h-3.5 w-3.5 text-cyan-400" />
            <span>Motion Energy: <strong className="text-white font-mono">{(stats.motionEnergy * 100).toFixed(0)}%</strong></span>
          </div>
          <div className="flex items-center gap-1.5">
            <Activity className="h-3.5 w-3.5 text-emerald-400" />
            <span>Floor Subtraction: <strong className="text-white font-mono">Slope {stats.floorSlope.toFixed(4)}</strong></span>
          </div>
        </div>
      </div>

      {/* Directional Obstacle Corridor Matrix (Left, Center, Right) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-slate-400 px-1">
          <span className="font-semibold uppercase tracking-wider">Regional Corridor Assessment (Floor Subtracted)</span>
          <span>Multi-Frame Persistence: 3-of-5 Confirmation</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* LEFT ZONE */}
          <div className={`rounded-2xl p-5 border transition-all ${getRiskColor(stats.left.riskLevel)}`}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300">Left Corridor</span>
              <span className={`text-[10px] font-black px-2 py-0.5 rounded ${getRiskBadge(stats.left.riskLevel).bg}`}>
                {getRiskBadge(stats.left.riskLevel).label}
              </span>
            </div>
            <div className="mt-3 flex items-baseline justify-between">
              <div className="text-3xl font-extrabold font-mono tabular-nums">
                {(stats.left.smoothedDisparity * 100).toFixed(0)}%
              </div>
              <div className="text-xs text-slate-400 font-mono">
                Coverage: {(stats.left.spatialCoverageRatio * 100).toFixed(0)}%
              </div>
            </div>
            <div className="text-xs text-slate-300 mt-2 line-clamp-2">
              {stats.left.activeReason}
            </div>
            <div className="mt-3 h-2 w-full bg-black/40 rounded-full overflow-hidden">
              <div
                className="h-full bg-current transition-all duration-150"
                style={{ width: `${Math.min(100, stats.left.smoothedDisparity * 100)}%` }}
              />
            </div>
          </div>

          {/* CENTER ZONE */}
          <div className={`rounded-2xl p-5 border transition-all ${getRiskColor(stats.center.riskLevel)}`}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300">Center Corridor</span>
              <span className={`text-[10px] font-black px-2 py-0.5 rounded ${getRiskBadge(stats.center.riskLevel).bg}`}>
                {getRiskBadge(stats.center.riskLevel).label}
              </span>
            </div>
            <div className="mt-3 flex items-baseline justify-between">
              <div className="text-3xl font-extrabold font-mono tabular-nums">
                {(stats.center.smoothedDisparity * 100).toFixed(0)}%
              </div>
              <div className="text-xs text-slate-400 font-mono">
                Coverage: {(stats.center.spatialCoverageRatio * 100).toFixed(0)}%
              </div>
            </div>
            <div className="text-xs text-slate-300 mt-2 line-clamp-2">
              {stats.center.activeReason}
            </div>
            <div className="mt-3 h-2 w-full bg-black/40 rounded-full overflow-hidden">
              <div
                className="h-full bg-current transition-all duration-150"
                style={{ width: `${Math.min(100, stats.center.smoothedDisparity * 100)}%` }}
              />
            </div>
          </div>

          {/* RIGHT ZONE */}
          <div className={`rounded-2xl p-5 border transition-all ${getRiskColor(stats.right.riskLevel)}`}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300">Right Corridor</span>
              <span className={`text-[10px] font-black px-2 py-0.5 rounded ${getRiskBadge(stats.right.riskLevel).bg}`}>
                {getRiskBadge(stats.right.riskLevel).label}
              </span>
            </div>
            <div className="mt-3 flex items-baseline justify-between">
              <div className="text-3xl font-extrabold font-mono tabular-nums">
                {(stats.right.smoothedDisparity * 100).toFixed(0)}%
              </div>
              <div className="text-xs text-slate-400 font-mono">
                Coverage: {(stats.right.spatialCoverageRatio * 100).toFixed(0)}%
              </div>
            </div>
            <div className="text-xs text-slate-300 mt-2 line-clamp-2">
              {stats.right.activeReason}
            </div>
            <div className="mt-3 h-2 w-full bg-black/40 rounded-full overflow-hidden">
              <div
                className="h-full bg-current transition-all duration-150"
                style={{ width: `${Math.min(100, stats.right.smoothedDisparity * 100)}%` }}
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
            <span className="text-sm font-bold text-white">Spatial Audio Engine Output</span>
          </div>
          <span className="text-xs text-slate-400">
            {stats.overallRisk === 'LOWER_DETECTED_RISK'
              ? 'Silent Mode (Preserving Ambient Environmental Hearing)'
              : isNavigating
              ? 'Event-Based Sonic Alerts'
              : 'Standby'}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-6">
          {/* Left Headphone Ear Channel */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-slate-400">
              <span className="font-semibold text-slate-300">Left Headphone Channel</span>
              <span className="font-mono tabular-nums">{leftVol}%</span>
            </div>
            <div className="h-6 w-full bg-slate-900 rounded-lg p-1 border border-slate-800">
              <div
                className={`h-full rounded transition-all duration-150 ${
                  stats.left.riskLevel === 'HIGH_RISK' ? 'bg-rose-500' : stats.left.riskLevel === 'ELEVATED_RISK' ? 'bg-amber-400' : 'bg-slate-800'
                }`}
                style={{ width: `${isNavigating ? leftVol : 0}%` }}
              />
            </div>
          </div>

          {/* Right Headphone Ear Channel */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-slate-400">
              <span className="font-semibold text-slate-300">Right Headphone Channel</span>
              <span className="font-mono tabular-nums">{rightVol}%</span>
            </div>
            <div className="h-6 w-full bg-slate-900 rounded-lg p-1 border border-slate-800">
              <div
                className={`h-full rounded transition-all duration-150 ${
                  stats.right.riskLevel === 'HIGH_RISK' ? 'bg-rose-500' : stats.right.riskLevel === 'ELEVATED_RISK' ? 'bg-amber-400' : 'bg-slate-800'
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
              <span className="text-slate-300">Voice Guidance</span>
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
              <span className="text-slate-300">Binaural Panning</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};
