import React from 'react';
import type { DiagnosisResult, SimulationState, NetworkMetrics, Scenario } from '../types';
import { getStatusColor, formatMetricChange } from '../engine/diagnostics';

interface DiagnosisProps {
  diagnosis: DiagnosisResult | null;
  simulation: SimulationState;
  /** Metrics snapshotted at the moment "Run Diagnosis" was clicked — the true baseline. */
  beforeMetrics: NetworkMetrics;
  selectedScenario: Scenario;
  onApplyAction: () => void;
  onReset: () => void;
}

const ConfidenceMeter: React.FC<{ value: number }> = ({ value }) => {
  const color = value >= 90 ? '#22c55e' : value >= 75 ? '#f59e0b' : '#ef4444';
  return (
    <div className="confidence-meter">
      <div className="confidence-header">
        <span className="confidence-label">Confidence Score</span>
        <span className="confidence-value" style={{ color }}>{value}%</span>
      </div>
      <div className="confidence-bar-bg">
        <div className="confidence-bar-fill" style={{ width: `${value}%`, background: color }} />
      </div>
    </div>
  );
};

const Diagnosis: React.FC<DiagnosisProps> = ({
  diagnosis, simulation, beforeMetrics, selectedScenario: _scenario, onApplyAction, onReset,
}) => {
  // ── Idle state ─────────────────────────────────────────────────────────────
  if (simulation.phase === 'idle') {
    return (
      <div className="section-content">
        <div className="section-header">
          <div>
            <h2 className="section-title">Smart Diagnosis</h2>
            <p className="section-sub">Rule-based deterministic diagnostic engine · SIMULATED</p>
          </div>
        </div>
        <div className="idle-state">
          <div className="idle-icon">🧠</div>
          <div className="idle-title">Ready to Diagnose</div>
          <div className="idle-desc">
            Select a scenario from the Overview tab and click <strong>Run Smart Diagnosis</strong> to begin the
            DIAGNOSE → DECIDE → APPLY → VERIFY workflow.
          </div>
        </div>
      </div>
    );
  }

  // ── Analysing ──────────────────────────────────────────────────────────────
  if (simulation.phase === 'diagnosing') {
    return (
      <div className="section-content">
        <div className="section-header">
          <div>
            <h2 className="section-title">Smart Diagnosis</h2>
            <p className="section-sub">Analyzing network telemetry...</p>
          </div>
        </div>
        <div className="idle-state">
          <div className="pulse-loader">
            <div className="pulse-ring" />
            <div className="pulse-ring delay-1" />
            <div className="pulse-ring delay-2" />
            <span className="pulse-inner-icon">🧠</span>
          </div>
          <div className="idle-title">Analyzing Network Telemetry</div>
          <div className="idle-desc">Running rule-based diagnostic engine across all metrics...</div>
        </div>
      </div>
    );
  }

  if (!diagnosis) return null;

  // Use the snapshotted beforeMetrics (captured at diagnosis time) — not a static lookup
  const before = beforeMetrics;
  const after = simulation.afterMetrics;
  const isComplete = simulation.phase === 'complete';

  // Map simulation phase → step index (0-based)
  const phaseToStep: Record<string, number> = {
    diagnosed: 1, applying: 2, verifying: 3, complete: 4,
  };
  const currentStep = phaseToStep[simulation.phase] ?? 0;

  return (
    <div className="section-content">
      <div className="section-header">
        <div>
          <h2 className="section-title">Smart Diagnosis</h2>
          <p className="section-sub">Diagnostic workflow · DIAGNOSE → DECIDE → APPLY → VERIFY</p>
        </div>
        <button id="reset-sim-btn" className="reset-btn" onClick={onReset}>↺ Reset Simulation</button>
      </div>

      {/* Workflow stepper */}
      <div className="workflow-stepper">
        {['DIAGNOSE', 'DECIDE', 'APPLY', 'VERIFY'].map((step, i) => {
          const stepDone = i < currentStep;
          const stepActive = i === currentStep - 1;
          return (
            <React.Fragment key={step}>
              <div className={`step ${stepDone ? 'done' : stepActive ? 'active' : 'pending'}`}>
                <div className="step-circle">
                  {stepDone ? '✓' : i + 1}
                </div>
                <div className="step-label">{step}</div>
              </div>
              {i < 3 && <div className={`step-connector ${stepDone ? 'done' : ''}`} />}
            </React.Fragment>
          );
        })}
      </div>

      <div className="diagnosis-grid">
        {/* ── Left panel — Symptoms & Evidence ── */}
        <div className="diagnosis-panel">
          <div className="panel-title">🔍 Detected Symptoms</div>
          <ul className="symptoms-list">
            {diagnosis.symptoms.map((s, i) => (
              <li key={i} className="symptom-item">
                <span className="symptom-dot" />
                {s}
              </li>
            ))}
          </ul>

          <div className="panel-title" style={{ marginTop: 20 }}>📊 Evidence Matrix</div>
          <div className="evidence-table">
            {diagnosis.evidence.map((e, i) => (
              <div key={i} className="evidence-row">
                <span className="evidence-metric">{e.metric}</span>
                <span className="evidence-value" style={{ color: getStatusColor(e.status) }}>{e.value}</span>
                <span className="evidence-threshold">threshold: {e.threshold}</span>
                <span
                  className="evidence-badge"
                  style={{
                    background: getStatusColor(e.status) + '22',
                    color: getStatusColor(e.status),
                    border: `1px solid ${getStatusColor(e.status)}44`,
                  }}
                >
                  {e.status.toUpperCase()}
                </span>
              </div>
            ))}
          </div>

          <ConfidenceMeter value={diagnosis.confidence} />
          <div className="confidence-explanation">{diagnosis.confidenceExplanation}</div>
        </div>

        {/* ── Right panel — Decision & Action ── */}
        <div className="diagnosis-panel">
          <div className="panel-title">🎯 Root Cause</div>
          <div className="root-cause-box">
            {diagnosis.rootCause}
          </div>

          <div className="panel-title" style={{ marginTop: 20 }}>⚡ Recommended Action</div>
          <div className="action-box">
            <div className="action-text">{diagnosis.recommendedAction}</div>
            <div className="action-why">
              <strong>Why this action:</strong> {diagnosis.actionExplanation}
            </div>
            <div className="action-reject">
              <strong>❌ Alternative rejected:</strong> {diagnosis.alternativeRejected}
            </div>
            <div className="action-outcome">
              <strong>📈 Expected outcome:</strong> {diagnosis.expectedOutcome}
            </div>
          </div>

          {/* Apply button — only when we have a recommendation but haven't applied yet */}
          {simulation.phase === 'diagnosed' && (
            <button
              id="apply-action-btn"
              className="apply-btn"
              onClick={onApplyAction}
            >
              ⚡ Apply Recommended Action (Simulated)
            </button>
          )}

          {(simulation.phase === 'applying' || simulation.phase === 'verifying') && (
            <div className="applying-state">
              <span className="spin" style={{ fontSize: 20 }}>⟳</span>
              <span>{simulation.phase === 'applying' ? 'Applying action...' : 'Verifying results...'}</span>
            </div>
          )}

          {/* Verification result with accurate before/after comparison */}
          {isComplete && simulation.verificationStatus && (
            <div
              className={`verification-card ${
                simulation.verificationStatus === 'Improved'
                  ? 'improved'
                  : simulation.verificationStatus === 'Partially Improved'
                  ? 'partial'
                  : 'not-improved'
              }`}
            >
              <div className="verification-title">
                {simulation.verificationStatus === 'Improved' && '✅ Improved'}
                {simulation.verificationStatus === 'Partially Improved' && '⚠️ Partially Improved'}
                {simulation.verificationStatus === 'Not Improved' && '❌ Not Improved'}
              </div>

              {/* Before / After table */}
              {after && (
                <div className="comparison-grid">
                  {(
                    [
                      { label: 'Health Score', bk: 'healthScore', lowerBetter: false, unit: '' },
                      { label: 'Throughput',   bk: 'throughput',  lowerBetter: false, unit: ' Mbps' },
                      { label: 'Latency',      bk: 'latency',     lowerBetter: true,  unit: 'ms' },
                      { label: 'Packet Loss',  bk: 'packetLoss',  lowerBetter: true,  unit: '%' },
                      { label: 'Ch. Util.',    bk: 'channelUtilization', lowerBetter: true, unit: '%' },
                    ] as const
                  )
                    .filter(({ bk }) => after[bk] !== undefined)
                    .map(({ label, bk, lowerBetter, unit }) => {
                      const bVal = before[bk] as number;
                      const aVal = after[bk] as number;
                      const isInf = (v: number) => v > 9000;
                      const { text, improved } = formatMetricChange(bVal, aVal, lowerBetter);
                      return (
                        <div key={bk} className="comparison-row">
                          <span className="cmp-label">{label}</span>
                          <span className="cmp-before">{isInf(bVal) ? '∞' : bVal}{unit}</span>
                          <span className="cmp-arrow">→</span>
                          <span className="cmp-after">{isInf(aVal) ? '∞' : aVal}{unit}</span>
                          <span className={`cmp-delta ${improved ? 'delta-good' : 'delta-bad'}`}>
                            {improved ? '▲' : '▼'} {text}
                          </span>
                        </div>
                      );
                    })}
                </div>
              )}

              {simulation.nextStep && (
                <div className="next-step-box">
                  <strong>💡 Next Step:</strong> {simulation.nextStep}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Diagnosis;
