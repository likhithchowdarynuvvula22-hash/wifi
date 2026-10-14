import React from 'react';
import type { NetworkMetrics, Scenario } from '../types';
import { SCENARIO_LABELS, SCENARIO_ICONS } from '../data/mockData';
import { getHealthColor } from '../engine/diagnostics';

interface OverviewProps {
  metrics: NetworkMetrics;
  selectedScenario: Scenario;
  onScenarioChange: (s: Scenario) => void;
  onRunDiagnosis: () => void;
  simPhase: string;
}

const MetricCard: React.FC<{
  label: string;
  value: string | number;
  unit?: string;
  status: 'good' | 'warning' | 'critical';
  icon: string;
  sub?: string;
}> = ({ label, value, unit, status, icon, sub }) => {
  const colors = { good: '#22c55e', warning: '#f59e0b', critical: '#ef4444' };
  return (
    <div className="metric-card" style={{ borderColor: colors[status] + '44' }}>
      <div className="metric-card-header">
        <span className="metric-icon">{icon}</span>
        <span className="metric-status-dot" style={{ background: colors[status] }} />
      </div>
      <div className="metric-value" style={{ color: colors[status] }}>
        {value}<span className="metric-unit">{unit}</span>
      </div>
      <div className="metric-label">{label}</div>
      {sub && <div className="metric-sub">{sub}</div>}
    </div>
  );
};

const RadialGauge: React.FC<{ score: number }> = ({ score }) => {
  const r = 52;
  const circ = 2 * Math.PI * r;
  const arc = circ * 0.75;
  const filled = arc * (score / 100);
  const color = getHealthColor(score);

  return (
    <div className="radial-gauge">
      <svg width="140" height="140" viewBox="0 0 140 140">
        <circle cx="70" cy="70" r={r} fill="none" stroke="#1e293b" strokeWidth="12"
          strokeDasharray={`${arc} ${circ - arc}`}
          strokeLinecap="round" strokeDashoffset={-circ * 0.125}
          transform="rotate(135 70 70)" />
        <circle cx="70" cy="70" r={r} fill="none" stroke={color} strokeWidth="12"
          strokeDasharray={`${filled} ${circ - filled}`}
          strokeLinecap="round" strokeDashoffset={-circ * 0.125}
          transform="rotate(135 70 70)"
          style={{ transition: 'stroke-dasharray 0.8s ease, stroke 0.5s ease' }} />
        <text x="70" y="65" textAnchor="middle" fill={color} fontSize="26" fontWeight="700">{score}</text>
        <text x="70" y="82" textAnchor="middle" fill="#64748b" fontSize="11">/ 100</text>
        <text x="70" y="98" textAnchor="middle" fill="#94a3b8" fontSize="10">HEALTH</text>
      </svg>
    </div>
  );
};

const BandDistribution: React.FC<{ band24: number; band5: number }> = ({ band24, band5 }) => (
  <div className="band-distribution">
    <div className="band-label-row">
      <span className="band-tag band-24">2.4 GHz</span>
      <span className="band-pct">{band24}%</span>
    </div>
    <div className="band-bar-bg">
      <div className="band-bar-fill band-24-fill" style={{ width: `${band24}%` }} />
    </div>
    <div className="band-label-row" style={{ marginTop: 8 }}>
      <span className="band-tag band-5">5 GHz</span>
      <span className="band-pct">{band5}%</span>
    </div>
    <div className="band-bar-bg">
      <div className="band-bar-fill band-5-fill" style={{ width: `${band5}%` }} />
    </div>
  </div>
);

const Overview: React.FC<OverviewProps> = ({
  metrics, selectedScenario, onScenarioChange, onRunDiagnosis, simPhase
}) => {
  const scenarios: Scenario[] = ['A', 'B', 'C', 'D'];

  const latencyStatus = metrics.latency > 100 ? 'critical' : metrics.latency > 50 ? 'warning' : 'good';
  const throughputStatus = metrics.throughput < 10 ? 'critical' : metrics.throughput < 30 ? 'warning' : 'good';
  const lossStatus = metrics.packetLoss > 5 ? 'critical' : metrics.packetLoss > 1 ? 'warning' : 'good';
  const chanStatus = metrics.channelUtilization > 80 ? 'critical' : metrics.channelUtilization > 60 ? 'warning' : 'good';
  const upstreamStatus = metrics.upstreamStatus === 'failed' ? 'critical' : metrics.upstreamStatus === 'degraded' ? 'warning' : 'good';

  return (
    <div className="section-content">
      <div className="section-header">
        <div>
          <h2 className="section-title">Network Overview</h2>
          <p className="section-sub">Real-time simulated network telemetry · SIMULATED DATA</p>
        </div>
        <div className="upstream-badge" style={{
          background: metrics.upstreamStatus === 'failed' ? '#ef444422' : metrics.upstreamStatus === 'degraded' ? '#f59e0b22' : '#22c55e22',
          borderColor: metrics.upstreamStatus === 'failed' ? '#ef4444' : metrics.upstreamStatus === 'degraded' ? '#f59e0b' : '#22c55e',
          color: metrics.upstreamStatus === 'failed' ? '#ef4444' : metrics.upstreamStatus === 'degraded' ? '#f59e0b' : '#22c55e',
        }}>
          <span className="pulse-dot" style={{
            background: metrics.upstreamStatus === 'failed' ? '#ef4444' : metrics.upstreamStatus === 'degraded' ? '#f59e0b' : '#22c55e'
          }} />
          ISP Upstream: {metrics.upstreamStatus.toUpperCase()}
        </div>
      </div>

      {/* Scenario selector */}
      <div className="scenario-selector-card">
        <div className="scenario-selector-title">
          <span className="scenario-selector-icon">⚡</span>
          Select Diagnostic Scenario
          <span className="sim-label-inline">SIMULATED</span>
        </div>
        <div className="scenario-buttons">
          {scenarios.map((s) => (
            <button
              key={s}
              id={`scenario-btn-${s}`}
              className={`scenario-btn ${selectedScenario === s ? 'active' : ''}`}
              onClick={() => onScenarioChange(s)}
            >
              <span className="scenario-btn-icon">{SCENARIO_ICONS[s]}</span>
              <span className="scenario-btn-label">{SCENARIO_LABELS[s]}</span>
            </button>
          ))}
        </div>
        <button
          id="run-diagnosis-btn"
          className="run-diagnosis-btn"
          onClick={onRunDiagnosis}
          disabled={simPhase === 'diagnosing' || simPhase === 'applying' || simPhase === 'verifying'}
        >
          {simPhase === 'diagnosing' ? (
            <><span className="spin">⟳</span> Analyzing Network...</>
          ) : simPhase === 'applying' ? (
            <><span className="spin">⟳</span> Applying Action...</>
          ) : simPhase === 'verifying' ? (
            <><span className="spin">⟳</span> Verifying Results...</>
          ) : (
            <><span>🧠</span> Run Smart Diagnosis</>
          )}
        </button>
      </div>

      {/* Health score + metrics grid */}
      <div className="overview-grid">
        <div className="health-card">
          <div className="health-card-title">Network Health Score</div>
          <RadialGauge score={metrics.healthScore} />
          <div className="health-assessment">
            {metrics.healthScore >= 75 ? '✅ Healthy' : metrics.healthScore >= 50 ? '⚠️ Degraded' : '🔴 Critical'}
          </div>
          <BandDistribution band24={metrics.band24} band5={metrics.band5} />
          <div className="devices-count">
            <span className="devices-icon">📡</span>
            <span className="devices-num">{metrics.connectedDevices}</span>
            <span className="devices-label">Connected Devices</span>
          </div>
        </div>

        <div className="metrics-grid">
          <MetricCard label="Avg Throughput" value={metrics.throughput === 0 ? '0' : metrics.throughput} unit=" Mbps" status={throughputStatus} icon="⬆️" sub="Download speed" />
          <MetricCard label="Latency" value={metrics.latency > 999 ? '∞' : metrics.latency} unit={metrics.latency > 999 ? '' : 'ms'} status={latencyStatus} icon="⏱" sub="Round-trip time" />
          <MetricCard label="Packet Loss" value={metrics.packetLoss} unit="%" status={lossStatus} icon="📉" sub="Dropped packets" />
          <MetricCard label="Channel Util." value={metrics.channelUtilization} unit="%" status={chanStatus} icon="📊" sub="RF channel load" />
          <MetricCard label="ISP Upstream" value={metrics.upstreamStatus === 'failed' ? 'DOWN' : metrics.upstreamStatus === 'degraded' ? 'SLOW' : 'OK'} status={upstreamStatus} icon="🌐" sub="WAN connection" />
          <MetricCard label="Devices" value={metrics.connectedDevices} status="good" icon="📱" sub="Connected clients" />
        </div>
      </div>
    </div>
  );
};

export default Overview;
