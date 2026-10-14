import React from 'react';
import type { ActionHistoryEntry } from '../types';
import { SCENARIO_LABELS } from '../data/mockData';

interface ActionHistoryProps {
  entries: ActionHistoryEntry[];
  onClear: () => void;
}

const ActionHistory: React.FC<ActionHistoryProps> = ({ entries, onClear }) => {
  const statusConfig = {
    'Improved': { color: '#22c55e', icon: '✅', bg: '#22c55e11' },
    'Partially Improved': { color: '#f59e0b', icon: '⚠️', bg: '#f59e0b11' },
    'Not Improved': { color: '#ef4444', icon: '❌', bg: '#ef444411' },
  };

  return (
    <div className="section-content">
      <div className="section-header">
        <div>
          <h2 className="section-title">Action History</h2>
          <p className="section-sub">Log of all simulated diagnostic actions applied in this session</p>
        </div>
        {entries.length > 0 && (
          <button id="clear-history-btn" className="reset-btn" onClick={onClear}>🗑 Clear History</button>
        )}
      </div>

      {entries.length === 0 ? (
        <div className="idle-state">
          <div className="idle-icon">📋</div>
          <div className="idle-title">No Actions Yet</div>
          <div className="idle-desc">Run Smart Diagnosis and apply an action to see it logged here.</div>
        </div>
      ) : (
        <div className="history-list">
          {[...entries].reverse().map((entry, i) => {
            const cfg = statusConfig[entry.status];
            return (
              <div key={entry.id} id={`history-entry-${entry.id}`} className="history-entry" style={{ borderLeftColor: cfg.color }}>
                <div className="history-entry-header">
                  <div className="history-meta">
                    <span className="history-status-icon">{cfg.icon}</span>
                    <span className="history-status" style={{ color: cfg.color }}>{entry.status}</span>
                    <span className="history-scenario">{SCENARIO_LABELS[entry.scenario]}</span>
                  </div>
                  <span className="history-time">
                    {entry.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                </div>

                <div className="history-action">{entry.action}</div>

                <div className="history-comparison">
                  {Object.keys(entry.afterMetrics).map((key) => {
                    const bVal = entry.beforeMetrics[key as keyof typeof entry.beforeMetrics];
                    const aVal = entry.afterMetrics[key as keyof typeof entry.afterMetrics];
                    if (bVal === undefined || aVal === undefined) return null;
                    const lowerBetter = ['latency', 'packetLoss', 'channelUtilization'].includes(key);
                    const improved = lowerBetter ? (aVal as number) < (bVal as number) : (aVal as number) > (bVal as number);
                    const units: Record<string, string> = {
                      healthScore: '', throughput: ' Mbps', latency: 'ms', packetLoss: '%', channelUtilization: '%'
                    };
                    const labels: Record<string, string> = {
                      healthScore: 'Health', throughput: 'Throughput', latency: 'Latency', packetLoss: 'Pkt Loss', channelUtilization: 'Ch. Util.'
                    };
                    if (!labels[key]) return null;
                    return (
                      <div key={key} className="history-metric">
                        <span className="hm-label">{labels[key]}</span>
                        <span className="hm-before">{bVal as number > 9000 ? '∞' : bVal}{units[key]}</span>
                        <span className="hm-arrow">→</span>
                        <span className="hm-after" style={{ color: improved ? '#22c55e' : '#ef4444' }}>
                          {aVal as number > 9000 ? '∞' : aVal}{units[key]}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {entry.nextStep && (
                  <div className="history-next-step">💡 {entry.nextStep}</div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ActionHistory;
