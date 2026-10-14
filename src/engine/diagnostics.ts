import type { Scenario, NetworkMetrics, DiagnosisResult, VerificationStatus, Device, Room } from '../types';
import { SCENARIO_METRICS, SCENARIO_AFTER_METRICS, DIAGNOSIS_RESULTS } from '../data/mockData';

// ─── Diagnostic engine ────────────────────────────────────────────────────────

/** Run the deterministic rule-based diagnosis for the given scenario. */
export function runDiagnosis(scenario: Scenario): DiagnosisResult {
  return DIAGNOSIS_RESULTS[scenario];
}

/** Return the baseline (before-action) metrics for a scenario. */
export function getScenarioMetrics(scenario: Scenario): NetworkMetrics {
  return SCENARIO_METRICS[scenario];
}

/**
 * Apply the recommended action for a scenario and return the resulting metrics.
 * Results are deterministic — no random values.
 *
 * Scenario D deliberately returns the same metrics (Wi-Fi changes can't fix an ISP outage).
 */
export function applyAction(scenario: Scenario): {
  afterMetrics: Partial<NetworkMetrics>;
  verificationStatus: VerificationStatus;
  nextStep?: string;
} {
  const after = SCENARIO_AFTER_METRICS[scenario];

  let verificationStatus: VerificationStatus;
  let nextStep: string | undefined;

  switch (scenario) {
    case 'A':
      verificationStatus = 'Improved';
      break;
    case 'B':
      verificationStatus = 'Partially Improved';
      nextStep =
        'Signal improved across most rooms but coverage gaps persist in the Kitchen. Consider deploying a mesh node or Wi-Fi extender in that area for full coverage.';
      break;
    case 'C':
      verificationStatus = 'Improved';
      break;
    case 'D':
      // Wi-Fi changes have zero effect on an upstream outage — return unchanged metrics
      verificationStatus = 'Not Improved';
      nextStep =
        'Wi-Fi settings cannot repair an upstream outage. Power-cycle the modem and wait 2–5 minutes. If connectivity does not restore, contact your ISP support line and report the WAN link failure.';
      break;
    default:
      verificationStatus = 'Not Improved';
  }

  return { afterMetrics: after, verificationStatus, nextStep };
}

// ─── Device helpers ───────────────────────────────────────────────────────────

/**
 * Recalculate simulated per-device throughput after a band or priority change.
 * QoS does NOT create extra bandwidth; it redistributes existing capacity.
 */
export function recalculateDeviceMetrics(devices: Device[]): Device[] {
  // Total pool is fixed at the scenario capacity — we redistribute, not expand.
  const criticalBonus = 1.35;
  const highBonus = 1.15;
  const normalBonus = 1.0;
  const lowPenalty = 0.7;

  const BASE_THROUGHPUTS: Record<Device['type'], number> = {
    laptop: 8.4,
    smartphone: 12.1,
    tv: 48.0,
    guest: 3.2,
    iot: 0.1,
    tablet: 5.6,
  };

  return devices.map((d) => {
    let throughput = BASE_THROUGHPUTS[d.type];

    // Band effect: 5 GHz gives ~1.5× throughput when signal is Good or better
    const goodSignal = d.rssi >= -65;
    if (d.band === '5GHz' && goodSignal) {
      throughput = throughput * 1.5;
    } else if (d.band === '2.4GHz' && d.recommendedBand === '5GHz') {
      // On wrong band — reduced throughput
      throughput = throughput * 0.75;
    }

    // Priority effect
    switch (d.priority) {
      case 'Critical': throughput = throughput * criticalBonus; break;
      case 'High': throughput = throughput * highBonus; break;
      case 'Normal': throughput = throughput * normalBonus; break;
      case 'Low': throughput = throughput * lowPenalty; break;
    }

    // Cap TV at 48 Mbps max (it's a stream, not unlimited)
    if (d.type === 'tv') throughput = Math.min(throughput, 48);

    return { ...d, throughput: Math.round(throughput * 10) / 10 };
  });
}

/**
 * Compute the updated room coverage after a simulated router repositioning.
 * Uses a simple inverse-square-ish signal decay model (deterministic).
 */
export function computeOptimizedRooms(rooms: Room[]): Room[] {
  // New router position is hallway centre ≈ (45, 50) in SVG coords.
  // Each room's signal level is recalculated from that position.
  const newAP = { x: 45, y: 50 };

  function signalFromDistance(dist: number): number {
    // Free-space path loss approximation: signal = 100 - 7*dist (clamped)
    return Math.max(20, Math.min(98, Math.round(100 - 7 * dist)));
  }

  function qualityFromLevel(level: number): Room['signalQuality'] {
    if (level >= 80) return 'Excellent';
    if (level >= 60) return 'Good';
    if (level >= 40) return 'Fair';
    return 'Poor';
  }

  function roomCentre(r: Room) {
    return { cx: r.x + r.width / 2, cy: r.y + r.height / 2 };
  }

  function svgDistance(r: Room): number {
    const { cx, cy } = roomCentre(r);
    const dx = cx - newAP.x;
    const dy = cy - newAP.y;
    // Convert SVG units → rough metres (1 SVG unit ≈ 0.25 m)
    return Math.round(Math.sqrt(dx * dx + dy * dy) * 0.25 * 10) / 10;
  }

  return rooms.map((r) => {
    const distM = svgDistance(r);
    const level = signalFromDistance(distM);
    return {
      ...r,
      signalLevel: level,
      signalQuality: qualityFromLevel(level),
      distanceFromRouter: distM,
    };
  });
}

// ─── Colour helpers ───────────────────────────────────────────────────────────

export function getHealthColor(score: number): string {
  if (score >= 75) return '#22c55e';
  if (score >= 50) return '#f59e0b';
  if (score >= 25) return '#f97316';
  return '#ef4444';
}

export function getSignalColor(level: number): string {
  if (level >= 80) return '#22c55e';
  if (level >= 60) return '#84cc16';
  if (level >= 40) return '#f59e0b';
  return '#ef4444';
}

export function getStatusColor(status: 'warning' | 'critical' | 'ok'): string {
  if (status === 'ok') return '#22c55e';
  if (status === 'warning') return '#f59e0b';
  return '#ef4444';
}

export function getPriorityColor(priority: string): string {
  switch (priority) {
    case 'Critical': return '#ef4444';
    case 'High': return '#f97316';
    case 'Normal': return '#3b82f6';
    case 'Low': return '#64748b';
    default: return '#64748b';
  }
}

export function formatMetricChange(
  before: number,
  after: number,
  lowerIsBetter = false,
): { text: string; improved: boolean } {
  const diff = after - before;
  const improved = lowerIsBetter ? diff < 0 : diff > 0;
  const sign = diff > 0 ? '+' : '';
  return { text: `${sign}${diff.toFixed(1)}`, improved };
}
