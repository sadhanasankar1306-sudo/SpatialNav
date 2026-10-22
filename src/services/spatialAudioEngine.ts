import { AudioSettings, RegionalDepthStats, RiskLevel } from '../types/navigation';

export class SpatialAudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private pannerNode: StereoPannerNode | null = null;
  private currentOscillator: OscillatorNode | null = null;
  private pulseTimer: number | null = null;
  private isMuted: boolean = false;
  private lastSpokenPhrase: string = '';
  private lastSpokenTime: number = 0;
  private speechMinIntervalMs: number = 2800; // Debounce speech announcements
  private lastAlertTimestamp: number = 0;
  private lastAlertRisk: RiskLevel = 'LOWER_DETECTED_RISK';

  constructor() {
    // Lazy initialize on first user gesture
  }

  private initAudio() {
    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioContextClass();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.5, this.ctx.currentTime);

      if (this.ctx.createStereoPanner) {
        this.pannerNode = this.ctx.createStereoPanner();
        this.pannerNode.connect(this.masterGain);
      }
      this.masterGain.connect(this.ctx.destination);
    }

    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public updateSettings(settings: AudioSettings) {
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : settings.masterVolume, this.ctx.currentTime);
    }
  }

  public setMute(muted: boolean) {
    this.isMuted = muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(muted ? 0 : 0.5, this.ctx.currentTime);
    }
    if (muted) {
      this.stopContinuousBeep();
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    }
  }

  public stopAll() {
    this.stopContinuousBeep();
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }

  private stopContinuousBeep() {
    if (this.pulseTimer !== null) {
      window.clearInterval(this.pulseTimer);
      this.pulseTimer = null;
    }
    if (this.currentOscillator) {
      try {
        this.currentOscillator.stop();
        this.currentOscillator.disconnect();
      } catch {
        // ignore already stopped
      }
      this.currentOscillator = null;
    }
  }

  /**
   * Generates directional stereo cues based on regional depth assessments
   */
  public processNavigationFrame(
    stats: RegionalDepthStats,
    settings: AudioSettings,
    onSpeechUtterance?: (text: string) => void
  ) {
    if (this.isMuted || settings.masterVolume <= 0.01) {
      return;
    }

    this.initAudio();
    if (!this.ctx || !this.masterGain) return;

    // Handle UNKNOWN state
    if (stats.overallRisk === 'UNKNOWN') {
      const now = Date.now();
      if (now - this.lastAlertTimestamp > 3200) {
        this.triggerUnknownWarning();
        this.lastAlertTimestamp = now;
        if (settings.speechGuidanceEnabled) {
          this.speakGuidance(`Caution: ${stats.diagnosticSummary}`, onSpeechUtterance);
        }
      }
      return;
    }

    // Handle LOWER_DETECTED_RISK (Clear path: keep silent to preserve ambient hearing!)
    if (stats.overallRisk === 'LOWER_DETECTED_RISK') {
      this.stopContinuousBeep();
      this.lastAlertRisk = 'LOWER_DETECTED_RISK';
      return;
    }

    // Determine highest threat region
    const leftThreat = stats.left.smoothedDisparity;
    const centerThreat = stats.center.smoothedDisparity;
    const rightThreat = stats.right.smoothedDisparity;

    let targetPan = 0.0;
    let hazardLevel: RiskLevel = stats.overallRisk;
    let directionDescription = 'Ahead';

    if (stats.center.riskLevel === 'HIGH_RISK') {
      targetPan = 0.0;
      hazardLevel = 'HIGH_RISK';
      directionDescription = 'directly ahead';
    } else if (stats.left.riskLevel === 'HIGH_RISK') {
      targetPan = -0.85; // Left stereo channel
      hazardLevel = 'HIGH_RISK';
      directionDescription = 'on your left';
    } else if (stats.right.riskLevel === 'HIGH_RISK') {
      targetPan = 0.85; // Right stereo channel
      hazardLevel = 'HIGH_RISK';
      directionDescription = 'on your right';
    } else if (stats.center.riskLevel === 'ELEVATED_RISK') {
      targetPan = 0.0;
      hazardLevel = 'ELEVATED_RISK';
      directionDescription = 'approaching ahead';
    } else if (leftThreat > rightThreat) {
      targetPan = -0.85;
      hazardLevel = 'ELEVATED_RISK';
      directionDescription = 'approaching on left';
    } else {
      targetPan = 0.85;
      hazardLevel = 'ELEVATED_RISK';
      directionDescription = 'approaching on right';
    }

    // Frequency modulation: high urgency = higher pitch
    const targetFreq = hazardLevel === 'HIGH_RISK' ? 840 : 440;
    const pulseIntervalMs = hazardLevel === 'HIGH_RISK' ? 320 : 950;

    // Cooldown verification to avoid ear fatigue
    const now = Date.now();
    const cooldown = hazardLevel === 'HIGH_RISK' ? 320 : settings.alertCooldownMs || 1100;

    if (now - this.lastAlertTimestamp >= cooldown || (hazardLevel === 'HIGH_RISK' && this.lastAlertRisk !== 'HIGH_RISK')) {
      this.lastAlertTimestamp = now;
      this.lastAlertRisk = hazardLevel;
      this.playDirectionalBeep(targetPan, targetFreq, hazardLevel);
    }

    // Spoken voice guidance for major transitions
    if (settings.speechGuidanceEnabled) {
      if (hazardLevel === 'HIGH_RISK') {
        this.speakGuidance(`Obstacle ${directionDescription}`, onSpeechUtterance);
      } else if (hazardLevel === 'ELEVATED_RISK') {
        this.speakGuidance(`Notice: Obstacle ${directionDescription}`, onSpeechUtterance);
      }
    }
  }

  private playDirectionalBeep(pan: number, frequency: number, risk: RiskLevel) {
    if (!this.ctx || !this.masterGain || this.isMuted) return;

    const osc = this.ctx.createOscillator();
    const envelope = this.ctx.createGain();

    osc.type = risk === 'HIGH_RISK' ? 'sawtooth' : 'sine';
    osc.frequency.setValueAtTime(frequency, this.ctx.currentTime);

    const panner = this.ctx.createStereoPanner ? this.ctx.createStereoPanner() : null;
    if (panner) {
      panner.pan.setValueAtTime(pan, this.ctx.currentTime);
      osc.connect(envelope);
      envelope.connect(panner);
      panner.connect(this.masterGain);
    } else {
      osc.connect(envelope);
      envelope.connect(this.masterGain);
    }

    const now = this.ctx.currentTime;
    const duration = risk === 'HIGH_RISK' ? 0.08 : 0.06;
    envelope.gain.setValueAtTime(0.0001, now);
    envelope.gain.exponentialRampToValueAtTime(risk === 'HIGH_RISK' ? 0.45 : 0.25, now + 0.01);
    envelope.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  private triggerUnknownWarning() {
    this.stopContinuousBeep();
    if (!this.ctx || !this.masterGain || this.isMuted) return;

    // Distinct triple descending chime for UNKNOWN condition
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const env = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.setValueAtTime(260, now + 0.12);
    osc.frequency.setValueAtTime(200, now + 0.24);

    env.gain.setValueAtTime(0.25, now);
    env.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

    osc.connect(env);
    env.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.48);
  }

  public speakGuidance(text: string, onSpeechUtterance?: (text: string) => void) {
    if (this.isMuted) return;
    const now = Date.now();
    if (text === this.lastSpokenPhrase && now - this.lastSpokenTime < this.speechMinIntervalMs) {
      return;
    }

    this.lastSpokenPhrase = text;
    this.lastSpokenTime = now;

    if (onSpeechUtterance) {
      onSpeechUtterance(text);
    }

    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.15;
      utterance.pitch = 1.05;
      utterance.volume = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  }
}

export const spatialAudio = new SpatialAudioEngine();
