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
  private speechMinIntervalMs: number = 2400; // Debounce speech announcements

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
   * Generates directional stereo beeps based on regional depth stats
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
      this.triggerUnknownWarning();
      if (settings.speechGuidanceEnabled) {
        this.speakGuidance('Uncertain depth readings. Proceed with caution.', onSpeechUtterance);
      }
      return;
    }

    // Determine highest threat region
    const leftThreat = stats.left.smoothedDepth;
    const centerThreat = stats.center.smoothedDepth;
    const rightThreat = stats.right.smoothedDepth;
    const maxThreat = Math.max(leftThreat, centerThreat, rightThreat);

    if (maxThreat < 0.35) {
      // Clear path, stop beeping
      this.stopContinuousBeep();
      return;
    }

    // Determine directional panning (-1.0 to +1.0)
    let targetPan = 0;
    let hazardLevel: RiskLevel = 'LOW';
    let directionDescription = 'Ahead';

    if (centerThreat >= leftThreat && centerThreat >= rightThreat) {
      targetPan = 0.0;
      hazardLevel = stats.center.riskLevel;
      directionDescription = 'ahead';
    } else if (leftThreat > rightThreat) {
      targetPan = -0.85; // Left stereo channel
      hazardLevel = stats.left.riskLevel;
      directionDescription = 'on your left';
    } else {
      targetPan = 0.85; // Right stereo channel
      hazardLevel = stats.right.riskLevel;
      directionDescription = 'on your right';
    }

    // Calculate frequency: higher pitch for closer obstacles
    const freqRange = settings.maxFrequencyHz - settings.baseFrequencyHz;
    const normalizedThreat = Math.min(1.0, Math.max(0, (maxThreat - 0.3) / 0.7));
    const targetFreq = settings.baseFrequencyHz + (normalizedThreat * freqRange);

    // Pulse cadence: faster beeps for high hazard (from 1 Hz up to 6 Hz)
    const pulseIntervalMs = Math.max(130, Math.round(900 - (normalizedThreat * 750)));

    this.scheduleStereoPulse(targetPan, targetFreq, pulseIntervalMs, hazardLevel);

    // Speech guidance triggers for significant transitions
    if (settings.speechGuidanceEnabled && hazardLevel === 'HIGH') {
      const phrase = `Obstacle ${directionDescription}`;
      this.speakGuidance(phrase, onSpeechUtterance);
    } else if (settings.speechGuidanceEnabled && hazardLevel === 'MEDIUM') {
      if (stats.primaryDirection === 'LEFT') {
        this.speakGuidance('Obstacle approaching left', onSpeechUtterance);
      } else if (stats.primaryDirection === 'RIGHT') {
        this.speakGuidance('Obstacle approaching right', onSpeechUtterance);
      } else if (stats.primaryDirection === 'CENTER') {
        this.speakGuidance('Obstacle approaching center', onSpeechUtterance);
      }
    }
  }

  private scheduleStereoPulse(pan: number, frequency: number, intervalMs: number, risk: RiskLevel) {
    if (!this.ctx || !this.masterGain) return;

    if (this.pulseTimer !== null) {
      // Already running, update if needed
      return;
    }

    const playBeep = () => {
      if (!this.ctx || !this.masterGain || this.isMuted) return;

      const osc = this.ctx.createOscillator();
      const envelope = this.ctx.createGain();

      // Dual-timbre: square/triangle for high urgent alerts, sine for medium
      osc.type = risk === 'HIGH' ? 'sawtooth' : 'sine';
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

      // Attack and decay envelope
      const now = this.ctx.currentTime;
      const duration = risk === 'HIGH' ? 0.08 : 0.06;
      envelope.gain.setValueAtTime(0.0001, now);
      envelope.gain.exponentialRampToValueAtTime(0.35, now + 0.01);
      envelope.gain.exponentialRampToValueAtTime(0.0001, now + duration);

      osc.start(now);
      osc.stop(now + duration + 0.02);
    };

    playBeep();
    this.pulseTimer = window.setInterval(playBeep, intervalMs);
  }

  private triggerUnknownWarning() {
    this.stopContinuousBeep();
    if (!this.ctx || !this.masterGain || this.isMuted) return;

    // Distinct triple-chime descending for UNKNOWN / STALE warning
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const env = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.setValueAtTime(260, now + 0.12);
    osc.frequency.setValueAtTime(200, now + 0.24);

    env.gain.setValueAtTime(0.2, now);
    env.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

    osc.connect(env);
    env.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.42);
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
      utterance.rate = 1.15; // Slightly brisk for rapid spatial feedback
      utterance.pitch = 1.05;
      utterance.volume = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  }
}

export const spatialAudio = new SpatialAudioEngine();
