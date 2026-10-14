import React, { useState, useCallback, useRef } from 'react';
import type {
  Scenario, NavSection, SimulationState,
  DiagnosisResult, Device, Band, Priority,
  ActionHistoryEntry, NetworkMetrics, Room,
} from './types';
import {
  SCENARIO_METRICS, DEVICES, INITIAL_ROOMS,
} from './data/mockData';
import {
  runDiagnosis, applyAction,
  recalculateDeviceMetrics, computeOptimizedRooms,
} from './engine/diagnostics';
import Sidebar from './components/Sidebar';
import Overview from './components/Overview';
import Diagnosis from './components/Diagnosis';
import Devices from './components/Devices';
import Heatmap from './components/Heatmap';
import ActionHistory from './components/ActionHistory';
import { TestRunner } from './components/TestRunner';

let historyIdCounter = 0;

const App: React.FC = () => {
  // ── Navigation ──────────────────────────────────────────────────────────────
  const [activeSection, setActiveSection] = useState<NavSection>('overview');

  // ── Auto-Pilot Closed-Loop Autonomous Mode ──────────────────────────────────
  const [autoPilot, setAutoPilot] = useState<boolean>(false);

  // ── Efficiency Speed Mode (Turbo = 300ms vs Realistic = 1500ms) ─────────────
  const [turboMode, setTurboMode] = useState<boolean>(true);

  // ── Active scenario ──────────────────────────────────────────────────────────
  const [selectedScenario, setSelectedScenario] = useState<Scenario>('A');

  // ── Simulation workflow ──────────────────────────────────────────────────────
  const [simulation, setSimulation] = useState<SimulationState>({ phase: 'idle' });
  const [diagnosis, setDiagnosis] = useState<DiagnosisResult | null>(null);

  // ── Devices (global, mutable) ────────────────────────────────────────────────
  const [devices, setDevices] = useState<Device[]>(DEVICES);

  // ── Heatmap rooms (global state so reset works) ──────────────────────────────
  const [currentRooms, setCurrentRooms] = useState<Room[]>(INITIAL_ROOMS);
  const [optimizedRooms, setOptimizedRooms] = useState<Room[] | null>(null);

  // ── Action history ───────────────────────────────────────────────────────────
  const [actionHistory, setActionHistory] = useState<ActionHistoryEntry[]>([]);

  // ── Snapshot of "before" metrics (captured at diagnosis time) ─────────────────
  const beforeMetricsRef = useRef<NetworkMetrics>(SCENARIO_METRICS[selectedScenario]);

  // ── Derive current displayed metrics ─────────────────────────────────────────
  // After a completed simulation the dashboard shows the post-intervention values.
  const baseMetrics = SCENARIO_METRICS[selectedScenario];
  const currentMetrics: NetworkMetrics =
    simulation.phase === 'complete' && simulation.afterMetrics
      ? {
          ...baseMetrics,
          healthScore:
            simulation.afterMetrics.healthScore ?? baseMetrics.healthScore,
          throughput:
            simulation.afterMetrics.throughput ?? baseMetrics.throughput,
          latency:
            simulation.afterMetrics.latency ?? baseMetrics.latency,
          packetLoss:
            simulation.afterMetrics.packetLoss ?? baseMetrics.packetLoss,
          channelUtilization:
            simulation.afterMetrics.channelUtilization ?? baseMetrics.channelUtilization,
        }
      : baseMetrics;

  // ── Scenario change: reset simulation so all pages start fresh ───────────────
  const handleScenarioChange = useCallback((s: Scenario) => {
    setSelectedScenario(s);
    setSimulation({ phase: 'idle' });
    setDiagnosis(null);
    // Do NOT reset devices/heatmap — user may want to inspect changes across scenarios
  }, []);

  // ── Full reset ────────────────────────────────────────────────────────────────
  const handleFullReset = useCallback(() => {
    setSimulation({ phase: 'idle' });
    setDiagnosis(null);
    setCurrentRooms(INITIAL_ROOMS);
    setOptimizedRooms(null);
    setDevices(DEVICES);
  }, []);

  // ── Run diagnosis with high-efficiency duration ─────────────────────────────
  const handleRunDiagnosis = useCallback(() => {
    // Capture before-metrics at the time diagnosis is triggered,
    // using current scenario baseline (not any lingering afterMetrics)
    beforeMetricsRef.current = SCENARIO_METRICS[selectedScenario];

    setSimulation({ phase: 'diagnosing' });
    setActiveSection('diagnosis');

    const diagDelay = turboMode ? 350 : 1500;
    setTimeout(() => {
      const result = runDiagnosis(selectedScenario);
      setDiagnosis(result);
      setSimulation({ phase: 'diagnosed' });
    }, diagDelay);
  }, [selectedScenario, turboMode]);

  // ── Apply action with high-efficiency pipeline ──────────────────────────────
  const handleApplyAction = useCallback(() => {
    if (!diagnosis) return;

    // Capture the baseline before we mutate anything
    const before = beforeMetricsRef.current;

    setSimulation((prev) => ({ ...prev, phase: 'applying' }));

    const stepDelay = turboMode ? 280 : 1200;
    setTimeout(() => {
      setSimulation((prev) => ({ ...prev, phase: 'verifying' }));

      setTimeout(() => {
        const { afterMetrics, verificationStatus, nextStep } = applyAction(selectedScenario);

        setSimulation({
          phase: 'complete',
          beforeMetrics: before,
          afterMetrics,
          verificationStatus,
          nextStep,
        });

        // Record in history
        const entry: ActionHistoryEntry = {
          id: String(++historyIdCounter),
          timestamp: new Date(),
          scenario: selectedScenario,
          action: diagnosis.recommendedAction,
          status: verificationStatus,
          beforeMetrics: {
            healthScore: before.healthScore,
            throughput: before.throughput,
            latency: before.latency,
            packetLoss: before.packetLoss,
            channelUtilization: before.channelUtilization,
          },
          afterMetrics,
          nextStep,
        };

        setActionHistory((prev) => [...prev, entry]);
      }, stepDelay);
    }, stepDelay);
  }, [diagnosis, selectedScenario, turboMode]);

  // ── Reset simulation (Diagnosis panel button) ─────────────────────────────────
  const handleResetSimulation = useCallback(() => {
    setSimulation({ phase: 'idle' });
    setDiagnosis(null);
  }, []);

  // ── Device: band reassignment ─────────────────────────────────────────────────
  const handleBandReassign = useCallback((deviceId: string, newBand: Band) => {
    setDevices((prev) => {
      const updated = prev.map((d) =>
        d.id === deviceId
          ? { ...d, band: newBand, bandAssigned: newBand === d.recommendedBand }
          : d,
      );
      // Recalculate throughput for all devices given new band assignments
      return recalculateDeviceMetrics(updated);
    });
  }, []);

  // ── Device: priority change ───────────────────────────────────────────────────
  const handlePriorityChange = useCallback((deviceId: string, priority: Priority) => {
    setDevices((prev) => {
      const updated = prev.map((d) =>
        d.id === deviceId ? { ...d, priority } : d,
      );
      // Recalculate throughput given new QoS weights
      return recalculateDeviceMetrics(updated);
    });
  }, []);

  // ── Heatmap: simulate router reposition ───────────────────────────────────────
  const handleSimulateRouterReposition = useCallback(() => {
    const optimized = computeOptimizedRooms(currentRooms);
    setOptimizedRooms(optimized);
  }, [currentRooms]);

  // ── Heatmap: reset to initial coverage ───────────────────────────────────────
  const handleResetHeatmap = useCallback(() => {
    setCurrentRooms(INITIAL_ROOMS);
    setOptimizedRooms(null);
  }, []);

  // ── History: clear ────────────────────────────────────────────────────────────
  const handleClearHistory = useCallback(() => {
    setActionHistory([]);
  }, []);

  // When Auto-Pilot is enabled, automatically trigger closed-loop healing
  React.useEffect(() => {
    if (autoPilot && simulation.phase === 'idle') {
      const timer = setTimeout(() => {
        handleRunDiagnosis();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [autoPilot, simulation.phase, handleRunDiagnosis]);

  React.useEffect(() => {
    if (autoPilot && simulation.phase === 'diagnosed') {
      const timer = setTimeout(() => {
        handleApplyAction();
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [autoPilot, simulation.phase, handleApplyAction]);

  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <div className="app">
      <Sidebar activeSection={activeSection} onNavigate={setActiveSection} />
      <main className="main-content">
        {/* Top bar */}
        <header className="top-bar">
          <div className="top-bar-left">
            <h1 className="page-title">
              {activeSection === 'overview' && 'Network Overview'}
              {activeSection === 'diagnosis' && 'Smart Diagnosis'}
              {activeSection === 'devices' && 'Device Management'}
              {activeSection === 'heatmap' && 'Coverage Heatmap'}
              {activeSection === 'history' && 'Action History'}
              {activeSection === 'testing' && 'Automated Testing & Verification'}
            </h1>
            <span className="page-subtitle">WiFiMind Intelligent Recovery Dashboard</span>
          </div>
          <div className="top-bar-right" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {/* Auto-Pilot Autonomous Mode Toggle */}
            <button
              id="autopilot-toggle-btn"
              onClick={() => setAutoPilot((prev) => !prev)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 14px',
                borderRadius: '20px',
                border: autoPilot ? '1px solid #22c55e' : '1px solid rgba(255, 255, 255, 0.2)',
                background: autoPilot ? 'rgba(34, 197, 94, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                color: autoPilot ? '#4ade80' : '#cbd5e1',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              title="Toggle Autonomous Closed-Loop Self-Healing"
            >
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: autoPilot ? '#22c55e' : '#64748b',
                  boxShadow: autoPilot ? '0 0 8px #22c55e' : 'none',
                }}
              />
              Auto-Pilot: {autoPilot ? 'ACTIVE' : 'OFF'}
            </button>

            {/* Efficiency / Turbo Speed Toggle */}
            <button
              id="turbo-toggle-btn"
              onClick={() => setTurboMode((prev) => !prev)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: '20px',
                border: turboMode ? '1px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.2)',
                background: turboMode ? 'rgba(56, 189, 248, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                color: turboMode ? '#38bdf8' : '#cbd5e1',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              title="Toggle Sub-Second Turbo Execution Speed (Efficiency Mode)"
            >
              <span>⚡</span>
              <span>Turbo: {turboMode ? 'ON (0.3s)' : 'REAL (1.5s)'}</span>
            </button>

            <div className="scenario-indicator">
              <span className="scenario-indicator-dot" />
              Active: Scenario {selectedScenario}
            </div>
            {simulation.phase === 'complete' && (
              <button
                id="global-reset-btn"
                className="reset-btn"
                onClick={handleFullReset}
                title="Reset simulation and restore all defaults"
              >
                ↺ Reset All
              </button>
            )}
            <div className="sim-warning">⚠ SIMULATED — No Real Hardware</div>
          </div>
        </header>

        <div className="content-area">
          {activeSection === 'overview' && (
            <Overview
              metrics={currentMetrics}
              selectedScenario={selectedScenario}
              onScenarioChange={handleScenarioChange}
              onRunDiagnosis={handleRunDiagnosis}
              simPhase={simulation.phase}
            />
          )}

          {activeSection === 'diagnosis' && (
            <Diagnosis
              diagnosis={diagnosis}
              simulation={simulation}
              beforeMetrics={beforeMetricsRef.current}
              selectedScenario={selectedScenario}
              onApplyAction={handleApplyAction}
              onReset={handleResetSimulation}
            />
          )}

          {activeSection === 'devices' && (
            <Devices
              devices={devices}
              scenario={selectedScenario}
              onBandReassign={handleBandReassign}
              onPriorityChange={handlePriorityChange}
            />
          )}

          {activeSection === 'heatmap' && (
            <Heatmap
              currentRooms={currentRooms}
              optimizedRooms={optimizedRooms}
              onSimulate={handleSimulateRouterReposition}
              onReset={handleResetHeatmap}
            />
          )}

          {activeSection === 'history' && (
            <ActionHistory
              entries={actionHistory}
              onClear={handleClearHistory}
            />
          )}

          {activeSection === 'testing' && <TestRunner />}
        </div>
      </main>
    </div>
  );
};

export default App;
