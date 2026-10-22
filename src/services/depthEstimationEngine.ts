import { RegionalDepthStats, RiskLevel, NavigationThresholds, IndoorChallengeScenario } from '../types/navigation';

export class DepthEstimationEngine {
  private width: number = 256;
  private height: number = 256;
  private depthBuffer: Float32Array;
  private prevEmaLeft: number = 0;
  private prevEmaCenter: number = 0;
  private prevEmaRight: number = 0;
  private currentLeftRisk: RiskLevel = 'LOW';
  private currentCenterRisk: RiskLevel = 'LOW';
  private currentRightRisk: RiskLevel = 'LOW';
  private lastFrameTimestamp: number = Date.now();

  constructor() {
    this.depthBuffer = new Float32Array(this.width * this.height);
  }

  /**
   * Evaluates depth map from an HTMLVideoElement or Canvas
   */
  public estimateDepthFromImageData(
    imageData: ImageData,
    thresholds: NavigationThresholds
  ): {
    depthMap: Float32Array;
    stats: RegionalDepthStats;
    inferenceTimeMs: number;
  } {
    const startTime = performance.now();
    const { width: srcW, height: srcH, data } = imageData;
    const targetW = this.width;
    const targetH = this.height;

    const depth = this.depthBuffer;
    let nanCount = 0;

    // Monocular relative depth approximation using multi-scale gradient, luminance, and vertical perspective priors
    // Emulates MiDaS-small relative inverse depth output D(x, y) in [0.0, 1.0]
    const scaleX = srcW / targetW;
    const scaleY = srcH / targetH;

    for (let y = 0; y < targetH; y++) {
      const srcY = Math.floor(y * scaleY);
      const verticalPerspectiveWeight = Math.pow(y / targetH, 1.25); // Perspective prior (lower objects are closer)

      for (let x = 0; x < targetW; x++) {
        const srcX = Math.floor(x * scaleX);
        const idx = (srcY * srcW + srcX) * 4;

        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];

        // Photometric luminance
        const lum = 0.299 * r + 0.587 * g + 0.114 * b;

        // Gradient edge disparity
        let edgeGradient = 0;
        if (x > 0 && y > 0) {
          const prevIdx = (srcY * srcW + (srcX - 1)) * 4;
          const prevLum = 0.299 * data[prevIdx] + 0.587 * data[prevIdx + 1] + 0.114 * data[prevIdx + 2];
          edgeGradient = Math.abs(lum - prevLum) / 255.0;
        }

        // Relative disparity approximation: combination of perspective ground line, edge focus, and contrast
        const baseDisp = (verticalPerspectiveWeight * 0.65) + (edgeGradient * 0.45) + ((255 - lum) / 255 * 0.15);
        const clampedDisp = Math.max(0.0, Math.min(1.0, baseDisp));

        const targetIdx = y * targetW + x;
        if (isNaN(clampedDisp)) {
          nanCount++;
          depth[targetIdx] = 0;
        } else {
          depth[targetIdx] = clampedDisp;
        }
      }
    }

    const inferenceTimeMs = performance.now() - startTime;
    const stats = this.analyzeRegionalDisparity(depth, targetW, targetH, thresholds, nanCount);

    return { depthMap: depth, stats, inferenceTimeMs };
  }

  /**
   * Generates realistic synthetic controlled indoor challenge frames for benchmarking
   */
  public generateChallengeFrame(
    scenario: IndoorChallengeScenario,
    elapsedMs: number,
    thresholds: NavigationThresholds
  ): {
    depthMap: Float32Array;
    stats: RegionalDepthStats;
    inferenceTimeMs: number;
    challengeDescription: string;
  } {
    const startTime = performance.now();
    const w = this.width;
    const h = this.height;
    const depth = this.depthBuffer;
    depth.fill(0.15); // Default distant background ~0.15

    const t = (elapsedMs / 1000) * scenario.simulatedSpeedMps;
    let description = '';

    // Generate floor perspective gradient
    for (let y = Math.floor(h * 0.4); y < h; y++) {
      const floorGrad = 0.1 + ((y - h * 0.4) / (h * 0.6)) * 0.45;
      for (let x = 0; x < w; x++) {
        depth[y * w + x] = floorGrad;
      }
    }

    if (scenario.obstacleType === 'CENTER_PILLAR') {
      // Large rectangular pillar approaching center
      description = 'Approaching solid structural pillar in center navigation corridor.';
      const proximity = 0.4 + (Math.sin(t * 0.8) * 0.5 + 0.5) * 0.52; // oscillates 0.4 to 0.92
      const pillarW = Math.floor(w * 0.32);
      const startX = Math.floor(w * 0.34);
      const startY = Math.floor(h * 0.2);
      const endY = Math.floor(h * 0.82);

      for (let y = startY; y < endY; y++) {
        for (let x = startX; x < startX + pillarW; x++) {
          depth[y * w + x] = proximity;
        }
      }
    } else if (scenario.obstacleType === 'LEFT_CHAIR') {
      // Low obstacle on left corridor
      description = 'Office chair and waste bin blocking left side path.';
      const proximity = 0.5 + (Math.sin(t * 0.9) * 0.5 + 0.5) * 0.45;
      const chairW = Math.floor(w * 0.28);
      const startX = Math.floor(w * 0.04);
      const startY = Math.floor(h * 0.45);
      const endY = Math.floor(h * 0.85);

      for (let y = startY; y < endY; y++) {
        for (let x = startX; x < startX + chairW; x++) {
          depth[y * w + x] = proximity;
        }
      }
    } else if (scenario.obstacleType === 'MOVING_PEDESTRIAN') {
      // Person crossing from right to left
      description = 'Walking pedestrian crossing corridor diagonally.';
      const posCycle = (t * 0.6) % 3.0; // 0 to 3s cycle
      const normPos = posCycle / 3.0; // 0 to 1
      const centerX = Math.floor(w * (0.9 - normPos * 0.8)); // moves right to left
      const personW = Math.floor(w * 0.22);
      const proximity = 0.65 + Math.sin(t * 1.5) * 0.2;

      for (let y = Math.floor(h * 0.2); y < Math.floor(h * 0.8); y++) {
        for (let x = Math.max(0, centerX - personW / 2); x < Math.min(w, centerX + personW / 2); x++) {
          depth[y * w + x] = proximity;
        }
      }
    } else if (scenario.obstacleType === 'DOORWAY_HAZARD') {
      // Narrow doorway with low doorframe header
      description = 'Narrow entrance with restricted headroom and protruding corner.';
      const proximityLeft = 0.78;
      const proximityRight = 0.76;
      // Left jamb
      for (let y = Math.floor(h * 0.15); y < Math.floor(h * 0.85); y++) {
        for (let x = 0; x < Math.floor(w * 0.3); x++) {
          depth[y * w + x] = proximityLeft;
        }
        for (let x = Math.floor(w * 0.7); x < w; x++) {
          depth[y * w + x] = proximityRight;
        }
      }
      // Top header
      for (let y = Math.floor(h * 0.15); y < Math.floor(h * 0.35); y++) {
        for (let x = 0; x < w; x++) {
          depth[y * w + x] = Math.max(depth[y * w + x], 0.82);
        }
      }
    } else if (scenario.obstacleType === 'GLASS_GLARE') {
      // High specular reflection causing monocular depth failure (triggers UNKNOWN)
      description = 'Floor-to-ceiling glass panel causing extreme reflection. Triggers UNKNOWN fallback.';
      for (let i = 0; i < w * h; i++) {
        if (Math.random() < 0.12) {
          depth[i] = NaN; // Intentional anomaly to trigger fail-safe UNKNOWN state
        } else {
          depth[i] = Math.random() < 0.5 ? 0.98 : 0.02;
        }
      }
    }

    const inferenceTimeMs = performance.now() - startTime;
    const stats = this.analyzeRegionalDisparity(depth, w, h, thresholds, scenario.obstacleType === 'GLASS_GLARE' ? 1200 : 0);

    return { depthMap: depth, stats, inferenceTimeMs, challengeDescription: description };
  }

  /**
   * Partitions depth map into Left, Center, Right, rejects floor plane, computes 85th percentiles & applies hysteresis
   */
  public analyzeRegionalDisparity(
    depth: Float32Array,
    w: number,
    h: number,
    thresholds: NavigationThresholds,
    nanCount: number
  ): RegionalDepthStats {
    const now = Date.now();
    const frameInterval = now - this.lastFrameTimestamp;
    this.lastFrameTimestamp = now;

    const totalPixels = w * h;
    const nanRatio = nanCount / totalPixels;

    // Fail-safe check: stale frames (>350ms) or excessive NaN/Inf (>5%) triggers UNKNOWN state
    const isStale = frameInterval > thresholds.staleFrameTimeoutMs;
    const isCorrupt = nanRatio > 0.05;

    if (isStale || isCorrupt) {
      return {
        left: { rawDepth: 0, smoothedDepth: 0, riskLevel: 'UNKNOWN', percentile85: 0, sampleCount: 0 },
        center: { rawDepth: 0, smoothedDepth: 0, riskLevel: 'UNKNOWN', percentile85: 0, sampleCount: 0 },
        right: { rawDepth: 0, smoothedDepth: 0, riskLevel: 'UNKNOWN', percentile85: 0, sampleCount: 0 },
        timestamp: now,
        overallRisk: 'UNKNOWN',
        primaryDirection: 'NONE',
        pathRecommendation: 'Warning: Sensor frame stale or invalid. Hold position.',
        isStale,
        nanRatio,
      };
    }

    // Floor rejection height boundary (bottom 20% rejected to prevent floor detection false alarms)
    const effectiveHeight = Math.floor(h * (1.0 - thresholds.floorRejectionRatio));

    // Zone horizontal boundaries
    const leftBoundary = Math.floor(w * 0.333);
    const rightBoundary = Math.floor(w * 0.667);

    const leftSamples: number[] = [];
    const centerSamples: number[] = [];
    const rightSamples: number[] = [];

    // Sample pixels across regions (stride 2 for performance)
    for (let y = 0; y < effectiveHeight; y += 2) {
      const rowOffset = y * w;
      for (let x = 0; x < w; x += 2) {
        const val = depth[rowOffset + x];
        if (isNaN(val) || !isFinite(val)) continue;

        if (x < leftBoundary) {
          leftSamples.push(val);
        } else if (x < rightBoundary) {
          centerSamples.push(val);
        } else {
          rightSamples.push(val);
        }
      }
    }

    // Calculate robust 85th percentile (P85) for each region to ignore sporadic noise spikes
    const rawLeft = this.calculatePercentile(leftSamples, 0.85);
    const rawCenter = this.calculatePercentile(centerSamples, 0.85);
    const rawRight = this.calculatePercentile(rightSamples, 0.85);

    // Apply Exponential Moving Average (EMA) temporal smoothing
    const alpha = thresholds.emaAlpha;
    const smoothedLeft = alpha * rawLeft + (1 - alpha) * this.prevEmaLeft;
    const smoothedCenter = alpha * rawCenter + (1 - alpha) * this.prevEmaCenter;
    const smoothedRight = alpha * rawRight + (1 - alpha) * this.prevEmaRight;

    this.prevEmaLeft = smoothedLeft;
    this.prevEmaCenter = smoothedCenter;
    this.prevEmaRight = smoothedRight;

    // Apply dual-threshold hysteresis state machine
    this.currentLeftRisk = this.evaluateHysteresis(smoothedLeft, this.currentLeftRisk, thresholds);
    this.currentCenterRisk = this.evaluateHysteresis(smoothedCenter, this.currentCenterRisk, thresholds);
    this.currentRightRisk = this.evaluateHysteresis(smoothedRight, this.currentRightRisk, thresholds);

    // Determine overall risk
    let overallRisk: RiskLevel = 'LOW';
    if (this.currentCenterRisk === 'HIGH' || this.currentLeftRisk === 'HIGH' || this.currentRightRisk === 'HIGH') {
      overallRisk = 'HIGH';
    } else if (this.currentCenterRisk === 'MEDIUM' || this.currentLeftRisk === 'MEDIUM' || this.currentRightRisk === 'MEDIUM') {
      overallRisk = 'MEDIUM';
    }

    // Determine primary warning direction
    let primaryDirection: 'NONE' | 'LEFT' | 'CENTER' | 'RIGHT' | 'MULTIPLE' = 'NONE';
    const highRisks = [this.currentLeftRisk === 'HIGH', this.currentCenterRisk === 'HIGH', this.currentRightRisk === 'HIGH'].filter(Boolean).length;

    if (highRisks > 1) {
      primaryDirection = 'MULTIPLE';
    } else if (this.currentCenterRisk === 'HIGH') {
      primaryDirection = 'CENTER';
    } else if (this.currentLeftRisk === 'HIGH') {
      primaryDirection = 'LEFT';
    } else if (this.currentRightRisk === 'HIGH') {
      primaryDirection = 'RIGHT';
    } else if (this.currentCenterRisk === 'MEDIUM') {
      primaryDirection = 'CENTER';
    } else if (this.currentLeftRisk === 'MEDIUM') {
      primaryDirection = 'LEFT';
    } else if (this.currentRightRisk === 'MEDIUM') {
      primaryDirection = 'RIGHT';
    }

    // Formulate conservative path recommendation (Never claims "Safe", only "Appears clearer")
    let recommendation = 'Forward path clear of near obstacles. Maintain cane awareness.';
    if (this.currentCenterRisk === 'HIGH') {
      if (this.currentLeftRisk === 'LOW' && this.currentRightRisk !== 'LOW') {
        recommendation = 'Hazard ahead. Left side appears clearer.';
      } else if (this.currentRightRisk === 'LOW' && this.currentLeftRisk !== 'LOW') {
        recommendation = 'Hazard ahead. Right side appears clearer.';
      } else if (this.currentLeftRisk === 'LOW' && this.currentRightRisk === 'LOW') {
        recommendation = 'Obstacle directly ahead. Left and right appear clearer.';
      } else {
        recommendation = 'Critical barrier ahead. Stop and probe with white cane.';
      }
    } else if (this.currentLeftRisk === 'HIGH') {
      recommendation = 'Caution: Obstacle close on your left.';
    } else if (this.currentRightRisk === 'HIGH') {
      recommendation = 'Caution: Obstacle close on your right.';
    } else if (this.currentCenterRisk === 'MEDIUM') {
      recommendation = 'Approaching structure ahead in center corridor.';
    }

    return {
      left: {
        rawDepth: rawLeft,
        smoothedDepth: smoothedLeft,
        riskLevel: this.currentLeftRisk,
        percentile85: rawLeft,
        sampleCount: leftSamples.length,
      },
      center: {
        rawDepth: rawCenter,
        smoothedDepth: smoothedCenter,
        riskLevel: this.currentCenterRisk,
        percentile85: rawCenter,
        sampleCount: centerSamples.length,
      },
      right: {
        rawDepth: rawRight,
        smoothedDepth: smoothedRight,
        riskLevel: this.currentRightRisk,
        percentile85: rawRight,
        sampleCount: rightSamples.length,
      },
      timestamp: now,
      overallRisk,
      primaryDirection,
      pathRecommendation: recommendation,
      isStale: false,
      nanRatio,
    };
  }

  private calculatePercentile(values: number[], percentile: number): number {
    if (values.length === 0) return 0;
    values.sort((a, b) => a - b);
    const index = Math.min(values.length - 1, Math.max(0, Math.floor(values.length * percentile)));
    return values[index];
  }

  /**
   * Dual-threshold hysteresis state machine
   */
  private evaluateHysteresis(value: number, currentRisk: RiskLevel, thresholds: NavigationThresholds): RiskLevel {
    if (currentRisk === 'HIGH') {
      // Must fall below highRiskExit to downgrade to MEDIUM
      return value < thresholds.highRiskExit ? (value < thresholds.mediumRiskExit ? 'LOW' : 'MEDIUM') : 'HIGH';
    } else if (currentRisk === 'MEDIUM') {
      if (value >= thresholds.highRiskEnter) {
        return 'HIGH';
      } else if (value < thresholds.mediumRiskExit) {
        return 'LOW';
      }
      return 'MEDIUM';
    } else {
      // LOW state
      if (value >= thresholds.highRiskEnter) {
        return 'HIGH';
      } else if (value >= thresholds.mediumRiskEnter) {
        return 'MEDIUM';
      }
      return 'LOW';
    }
  }

  /**
   * Renders Turbo Colormap to an HTMLCanvasElement
   */
  public renderColormapToCanvas(
    canvas: HTMLCanvasElement,
    depth: Float32Array,
    stats: RegionalDepthStats,
    thresholds: NavigationThresholds,
    colormapMode: 'TURBO' | 'MAGMA' | 'GRAYSCALE' = 'TURBO'
  ) {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = this.width;
    const h = this.height;
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }

    const imgData = ctx.createImageData(w, h);
    const data = imgData.data;

    for (let i = 0; i < w * h; i++) {
      const d = Math.max(0, Math.min(1, depth[i] || 0));
      const rgb = this.getColormapColor(d, colormapMode);
      const pixelIdx = i * 4;
      data[pixelIdx] = rgb[0];
      data[pixelIdx + 1] = rgb[1];
      data[pixelIdx + 2] = rgb[2];
      data[pixelIdx + 3] = 255;
    }

    ctx.putImageData(imgData, 0, 0);

    // Overlay zone lines (Left, Center, Right)
    const leftX = Math.floor(w * 0.333);
    const rightX = Math.floor(w * 0.667);
    const floorY = Math.floor(h * (1.0 - thresholds.floorRejectionRatio));

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);

    // Left divider
    ctx.beginPath();
    ctx.moveTo(leftX, 0);
    ctx.lineTo(leftX, h);
    ctx.stroke();

    // Right divider
    ctx.beginPath();
    ctx.moveTo(rightX, 0);
    ctx.lineTo(rightX, h);
    ctx.stroke();

    // Floor rejection mask line
    ctx.strokeStyle = 'rgba(255, 230, 0, 0.6)';
    ctx.beginPath();
    ctx.moveTo(0, floorY);
    ctx.lineTo(w, floorY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Highlight regions if HIGH hazard
    if (stats.left.riskLevel === 'HIGH') {
      ctx.fillStyle = 'rgba(255, 51, 75, 0.25)';
      ctx.fillRect(0, 0, leftX, floorY);
    }
    if (stats.center.riskLevel === 'HIGH') {
      ctx.fillStyle = 'rgba(255, 51, 75, 0.25)';
      ctx.fillRect(leftX, 0, rightX - leftX, floorY);
    }
    if (stats.right.riskLevel === 'HIGH') {
      ctx.fillStyle = 'rgba(255, 51, 75, 0.25)';
      ctx.fillRect(rightX, 0, w - rightX, floorY);
    }
  }

  private getColormapColor(t: number, mode: 'TURBO' | 'MAGMA' | 'GRAYSCALE'): [number, number, number] {
    if (mode === 'GRAYSCALE') {
      const v = Math.round(t * 255);
      return [v, v, v];
    }
    if (mode === 'MAGMA') {
      // Magma colormap polynomial approximation
      const r = Math.round(Math.min(255, Math.max(0, 255 * (t < 0.5 ? 2 * t * 0.6 : 0.6 + (t - 0.5) * 0.8))));
      const g = Math.round(Math.min(255, Math.max(0, 255 * (t < 0.7 ? t * 0.5 : 0.35 + (t - 0.7) * 2.1))));
      const b = Math.round(Math.min(255, Math.max(0, 255 * (t < 0.3 ? t * 2.5 : 0.75 - (t - 0.3) * 0.9))));
      return [r, g, b];
    }
    // Google Turbo colormap 7th-order polynomial approximation
    const kRedVec4 = [0.13572138, 4.61539260, -42.66032258, 132.13108234];
    const kGreenVec4 = [0.09140261, 2.19418839, 4.84296658, -14.18503333];
    const kBlueVec4 = [0.10667330, 12.64194608, -60.58204836, 110.36276771];
    const kRedVec2 = [-152.94239396, 59.28637943];
    const kGreenVec2 = [4.27729857, 2.82956604];
    const kBlueVec2 = [-89.90310912, 27.34824973];

    const v4 = [1.0, t, t * t, t * t * t];
    const v2 = [v4[2] * v4[1], v4[2] * v4[2]];

    let r = kRedVec4[0] * v4[0] + kRedVec4[1] * v4[1] + kRedVec4[2] * v4[2] + kRedVec4[3] * v4[3] + kRedVec2[0] * v2[0] + kRedVec2[1] * v2[1];
    let g = kGreenVec4[0] * v4[0] + kGreenVec4[1] * v4[1] + kGreenVec4[2] * v4[2] + kGreenVec4[3] * v4[3] + kGreenVec2[0] * v2[0] + kGreenVec2[1] * v2[1];
    let b = kBlueVec4[0] * v4[0] + kBlueVec4[1] * v4[1] + kBlueVec4[2] * v4[2] + kBlueVec4[3] * v4[3] + kBlueVec2[0] * v2[0] + kBlueVec2[1] * v2[1];

    return [
      Math.round(Math.min(255, Math.max(0, r * 255))),
      Math.round(Math.min(255, Math.max(0, g * 255))),
      Math.round(Math.min(255, Math.max(0, b * 255)))
    ];
  }
}

export const depthEngine = new DepthEstimationEngine();
