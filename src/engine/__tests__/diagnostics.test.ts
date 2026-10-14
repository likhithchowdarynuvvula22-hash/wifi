import { describe, it, expect } from 'vitest';
import {
  runDiagnosis,
  getScenarioMetrics,
  applyAction,
  recalculateDeviceMetrics,
  computeOptimizedRooms,
  getHealthColor,
  getSignalColor,
  getStatusColor,
  formatMetricChange,
  sanitizeScenario,
  maskMacAddress,
} from '../diagnostics';
import type { Scenario, Device, Room } from '../../types';

describe('WiFiMind Decision Engine - Unit & Integration Test Suite', () => {
  describe('Deterministic Diagnostic Classification', () => {
    const scenarios: Scenario[] = ['A', 'B', 'C', 'D'];

    it('should return valid diagnostic results for all 4 pre-configured scenarios', () => {
      scenarios.forEach((s) => {
        const diag = runDiagnosis(s);
        expect(diag).toBeDefined();
        expect(diag.rootCause).toBeTruthy();
        expect(diag.confidence).toBeGreaterThanOrEqual(70);
        expect(diag.confidence).toBeLessThanOrEqual(100);
        expect(diag.recommendedAction).toBeTruthy();
        expect(diag.actionExplanation).toBeTruthy();
        expect(diag.alternativeRejected).toBeTruthy();
        expect(diag.expectedOutcome).toBeTruthy();
        expect(diag.evidence.length).toBeGreaterThanOrEqual(4);
      });
    });

    it('should correctly identify RF congestion in Scenario A', () => {
      const diagA = runDiagnosis('A');
      expect(diagA.rootCause.toLowerCase()).toContain('congestion');
      expect(diagA.recommendedAction.toLowerCase()).toContain('channel');
    });

    it('should correctly diagnose signal / coverage in Scenario B', () => {
      const diagB = runDiagnosis('B');
      expect(diagB.rootCause.toLowerCase()).toContain('coverage');
      expect(diagB.recommendedAction.toLowerCase()).toContain('reposition');
    });

    it('should identify bandwidth hog in Scenario C', () => {
      const diagC = runDiagnosis('C');
      expect(diagC.rootCause.toLowerCase()).toContain('bandwidth');
      expect(diagC.recommendedAction.toLowerCase()).toContain('qos');
    });

    it('should pinpoint upstream WAN/ISP failure in Scenario D', () => {
      const diagD = runDiagnosis('D');
      expect(diagD.rootCause.toLowerCase()).toContain('isp');
      expect(diagD.recommendedAction.toLowerCase()).toContain('modem');
    });
  });

  describe('Closed-Loop Recovery & Verification Logic', () => {
    it('should mark Scenario A as Improved with channel switch', () => {
      const res = applyAction('A');
      expect(res.verificationStatus).toBe('Improved');
      expect(res.afterMetrics.channelUtilization).toBeLessThan(50);
      expect(res.afterMetrics.latency).toBeLessThan(50);
    });

    it('should mark Scenario B as Partially Improved with mesh recommendation', () => {
      const res = applyAction('B');
      expect(res.verificationStatus).toBe('Partially Improved');
      expect(res.nextStep).toContain('mesh node');
    });

    it('should mark Scenario C as Improved after QoS enforcement', () => {
      const res = applyAction('C');
      expect(res.verificationStatus).toBe('Improved');
      expect(res.afterMetrics.healthScore).toBeGreaterThan(70);
    });

    it('should strictly NOT claim improvement for Scenario D (Safety Verification Guard)', () => {
      const res = applyAction('D');
      expect(res.verificationStatus).toBe('Not Improved');
      expect(res.nextStep).toContain('ISP');
      // Verifies that WiFiMind correctly identifies external failure and avoids false-positive recovery
      expect(res.afterMetrics.latency).toBe(9999);
      expect(res.afterMetrics.throughput).toBe(0);
    });
  });

  describe('RF Physics & Mathematical Invariants', () => {
    it('should obey device QoS capacity redistribution and band steering', () => {
      const mockDevices: Device[] = [
        { id: '1', name: 'Work Laptop', type: 'laptop', ipAddress: '192.168.1.10', macAddress: 'AA:BB:CC:11:22:33', manufacturer: 'Apple', band: '5GHz', recommendedBand: '5GHz', bandAssigned: true, signalStrength: 'Good', rssi: -60, throughput: 10, priority: 'Critical' },
        { id: '2', name: 'Torrent Client', type: 'laptop', ipAddress: '192.168.1.11', macAddress: 'AA:BB:CC:11:22:44', manufacturer: 'Dell', band: '2.4GHz', recommendedBand: '2.4GHz', bandAssigned: true, signalStrength: 'Good', rssi: -62, throughput: 50, priority: 'Low' },
      ];

      const recalculated = recalculateDeviceMetrics(mockDevices);
      const criticalDev = recalculated.find(d => d.priority === 'Critical')!;
      const lowDev = recalculated.find(d => d.priority === 'Low')!;

      // 5GHz + Good Signal + Critical bonus = 8.4 * 1.5 * 1.35 = 17.0 Mbps
      expect(criticalDev.throughput).toBeGreaterThan(15);
      // Low priority gets penalty
      expect(lowDev.throughput).toBeLessThan(10);
    });

    it('should simulate inverse-square RF path loss with floor plan repositioning', () => {
      const initialRooms: Room[] = [
        { id: 'living', name: 'Living Room', x: 10, y: 10, width: 30, height: 35, signalLevel: 45, signalQuality: 'Fair', distanceFromRouter: 12 },
        { id: 'hallway', name: 'Hallway', x: 45, y: 50, width: 25, height: 25, signalLevel: 90, signalQuality: 'Excellent', distanceFromRouter: 1 },
      ];

      const optimized = computeOptimizedRooms(initialRooms);
      expect(optimized).toHaveLength(2);
      optimized.forEach(r => {
        expect(r.signalLevel).toBeGreaterThanOrEqual(20);
        expect(r.signalLevel).toBeLessThanOrEqual(98);
      });
    });
  });

  describe('UI Telemetry Formatters & Guardrails', () => {
    it('should compute metric diffs with proper polarity', () => {
      // Lower is better (latency)
      const latencyResult = formatMetricChange(85, 24, true);
      expect(latencyResult.improved).toBe(true);
      expect(latencyResult.text).toBe('-61.0');

      // Higher is better (throughput)
      const throughputResult = formatMetricChange(18, 92, false);
      expect(throughputResult.improved).toBe(true);
      expect(throughputResult.text).toBe('+74.0');
    });

    it('should map health scores to appropriate color grades', () => {
      expect(getHealthColor(90)).toBe('#22c55e'); // Green
      expect(getHealthColor(60)).toBe('#f59e0b'); // Yellow/Amber
      expect(getHealthColor(30)).toBe('#f97316'); // Orange
      expect(getHealthColor(10)).toBe('#ef4444'); // Red
    });
  });

  describe('Security, Input Sanitization & Privacy Compliance', () => {
    it('should sanitize invalid scenario inputs and prevent prototype pollution', () => {
      expect(sanitizeScenario('__proto__')).toBe('A');
      expect(sanitizeScenario(12345)).toBe('A');
      expect(sanitizeScenario(null)).toBe('A');
      expect(sanitizeScenario('B')).toBe('B');
      expect(sanitizeScenario('D')).toBe('D');
    });

    it('should mask MAC addresses for GDPR and telemetry privacy compliance', () => {
      const masked = maskMacAddress('AA:BB:CC:DD:EE:FF');
      expect(masked).toBe('AA:BB:CC:XX:XX:XX');
      expect(maskMacAddress('')).toBe('XX:XX:XX:XX:XX:XX');
    });
  });
});

