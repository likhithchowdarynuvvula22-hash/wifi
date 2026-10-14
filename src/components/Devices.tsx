import React, { useState } from 'react';
import type { Device, Band, Priority, Scenario } from '../types';
import { getPriorityColor } from '../engine/diagnostics';

interface DevicesProps {
  devices: Device[];
  scenario: Scenario;
  onBandReassign: (deviceId: string, newBand: Band) => void;
  onPriorityChange: (deviceId: string, priority: Priority) => void;
}

const DeviceIcon: React.FC<{ type: Device['type'] }> = ({ type }) => {
  const icons: Record<Device['type'], string> = {
    laptop: '💻', smartphone: '📱', tv: '📺', guest: '👤', iot: '🌡', tablet: '📟',
  };
  return <span style={{ fontSize: 22 }}>{icons[type]}</span>;
};

const SignalBars: React.FC<{ rssi: number }> = ({ rssi }) => {
  const strength = rssi >= -55 ? 4 : rssi >= -65 ? 3 : rssi >= -75 ? 2 : 1;
  return (
    <div className="signal-bars">
      {[1, 2, 3, 4].map((b) => (
        <div
          key={b}
          className="signal-bar"
          style={{
            height: `${b * 4 + 4}px`,
            background: b <= strength
              ? (strength >= 3 ? '#22c55e' : strength === 2 ? '#f59e0b' : '#ef4444')
              : '#1e293b',
          }}
        />
      ))}
    </div>
  );
};

const priorities: Priority[] = ['Critical', 'High', 'Normal', 'Low'];

// Derive a human-readable band-recommendation reason
function bandRecommendationReason(device: Device): string {
  if (device.type === 'iot') return '2.4 GHz: better range for low-data IoT devices';
  if (device.type === 'guest') return device.rssi < -70 ? '2.4 GHz: guest is far from AP' : '5 GHz: guest is close enough';
  if (device.rssi < -70) return '2.4 GHz: weak signal — 5 GHz would be worse';
  if (device.type === 'tv' || device.type === 'laptop' || device.type === 'tablet')
    return '5 GHz: needs high throughput, good signal strength';
  return device.recommendedBand === '5GHz'
    ? '5 GHz: adequate signal, higher speed available'
    : '2.4 GHz: better range given current RSSI';
}

const Devices: React.FC<DevicesProps> = ({
  devices, scenario: _scenario, onBandReassign, onPriorityChange,
}) => {
  const [activeTab, setActiveTab] = useState<'bands' | 'priority'>('bands');
  const [justChanged, setJustChanged] = useState<string | null>(null);
  const [tooltip, setTooltip] = useState<string | null>(null);

  const handleBandChange = (id: string, band: Band) => {
    onBandReassign(id, band);
    setJustChanged(id);
    setTimeout(() => setJustChanged(null), 2000);
  };

  // Total throughput across all devices (for bandwidth share bar in priority tab)
  const totalThroughput = devices.reduce((s, d) => s + d.throughput, 0);

  return (
    <div className="section-content">
      <div className="section-header">
        <div>
          <h2 className="section-title">Device Management</h2>
          <p className="section-sub">Band recommendations & QoS prioritization · SIMULATED</p>
        </div>
        <div className="tab-switcher">
          <button
            id="tab-bands"
            className={`tab-btn ${activeTab === 'bands' ? 'active' : ''}`}
            onClick={() => setActiveTab('bands')}
          >
            📡 Band Steering
          </button>
          <button
            id="tab-priority"
            className={`tab-btn ${activeTab === 'priority' ? 'active' : ''}`}
            onClick={() => setActiveTab('priority')}
          >
            ⚡ QoS Priority
          </button>
        </div>
      </div>

      {/* ── Band Steering tab ── */}
      {activeTab === 'bands' && (
        <div>
          <div className="info-banner">
            <span>ℹ️</span>
            <span>
              Band selection affects per-device throughput. 5 GHz offers higher speed but shorter range.
              2.4 GHz is preferred for IoT and devices with weak signal (below −70 dBm).
              Reassigning a device updates its simulated throughput immediately.
            </span>
          </div>
          <div className="device-table">
            <div className="device-table-header" style={{ gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1.5fr' }}>
              <span>Device</span>
              <span>Signal</span>
              <span>Current Band</span>
              <span>Throughput</span>
              <span>Recommended</span>
              <span>Switch Band</span>
            </div>
            {devices.map((device) => {
              const needsChange = device.band !== device.recommendedBand;
              const changed = justChanged === device.id;
              const reason = bandRecommendationReason(device);
              return (
                <div
                  key={device.id}
                  className={`device-row ${changed ? 'device-changed' : ''}`}
                  style={{ gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1.5fr' }}
                >
                  <div
                    className="device-info"
                    onMouseEnter={() => setTooltip(`${device.name}: ${reason}`)}
                    onMouseLeave={() => setTooltip(null)}
                    style={{ cursor: 'help' }}
                  >
                    <DeviceIcon type={device.type} />
                    <div>
                      <div className="device-name">{device.name}</div>
                      <div className="device-meta">{device.manufacturer} · {device.ipAddress}</div>
                    </div>
                  </div>
                  <div className="device-signal">
                    <SignalBars rssi={device.rssi} />
                    <span className="rssi-val">{device.rssi} dBm</span>
                  </div>
                  <span className={`band-badge ${device.band === '5GHz' ? 'band-5-badge' : 'band-24-badge'}`}>
                    {device.band}
                  </span>
                  <span className="device-throughput">{device.throughput} Mbps</span>
                  <span className={`rec-badge ${device.recommendedBand === '5GHz' ? 'band-5-badge' : 'band-24-badge'}`}>
                    {device.recommendedBand}
                    {needsChange && <span className="rec-arrow"> ←</span>}
                  </span>
                  <div className="band-actions">
                    {(['2.4GHz', '5GHz'] as Band[]).map((b) => (
                      <button
                        key={b}
                        id={`band-${device.id}-${b.replace('.', '')}`}
                        className={`band-action-btn ${device.band === b ? 'active' : ''}`}
                        onClick={() => handleBandChange(device.id, b)}
                      >
                        {b}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {tooltip && (
            <div className="device-tooltip">
              💡 {tooltip}
            </div>
          )}
        </div>
      )}

      {/* ── QoS Priority tab ── */}
      {activeTab === 'priority' && (
        <div>
          <div className="info-banner">
            <span>⚠️</span>
            <span>
              <strong>Important:</strong> QoS prioritization allocates existing bandwidth more fairly.
              It does <strong>NOT</strong> create additional bandwidth — total capacity is fixed.
              Critical devices get packet-scheduling preference; Low-priority devices may be throttled
              during contention. Throughput values update to reflect the new allocation.
            </span>
          </div>
          <div className="device-table">
            <div className="device-table-header" style={{ gridTemplateColumns: '2fr 1fr 1fr 1fr 1.5fr' }}>
              <span>Device</span>
              <span>Type</span>
              <span>Throughput</span>
              <span>BW Share</span>
              <span>Set Priority</span>
            </div>
            {devices.map((device) => {
              const share = totalThroughput > 0
                ? Math.round((device.throughput / totalThroughput) * 100)
                : 0;
              return (
                <div
                  key={device.id}
                  className="device-row"
                  style={{ gridTemplateColumns: '2fr 1fr 1fr 1fr 1.5fr' }}
                >
                  <div className="device-info">
                    <DeviceIcon type={device.type} />
                    <div>
                      <div className="device-name">{device.name}</div>
                      <div className="device-meta">{device.macAddress}</div>
                    </div>
                  </div>
                  <span className="device-type-badge">{device.type.toUpperCase()}</span>
                  <span className="device-throughput">{device.throughput} Mbps</span>

                  {/* Bandwidth share mini-bar */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <span style={{ fontSize: 11, color: '#94a3b8' }}>{share}%</span>
                    <div style={{ height: 5, background: '#1e293b', borderRadius: 3, width: 60 }}>
                      <div style={{
                        height: '100%',
                        width: `${share}%`,
                        background: getPriorityColor(device.priority),
                        borderRadius: 3,
                        transition: 'width 0.5s ease',
                      }} />
                    </div>
                  </div>

                  <div className="priority-actions">
                    {priorities.map((p) => (
                      <button
                        key={p}
                        id={`priority-${device.id}-${p}`}
                        className={`priority-btn ${device.priority === p ? 'active' : ''}`}
                        style={{
                          borderColor: device.priority === p ? getPriorityColor(p) : 'transparent',
                          color: device.priority === p ? getPriorityColor(p) : '#64748b',
                          background: device.priority === p ? getPriorityColor(p) + '22' : 'transparent',
                        }}
                        onClick={() => onPriorityChange(device.id, p)}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Total throughput summary */}
          <div className="info-banner" style={{ marginTop: 14 }}>
            <span>📊</span>
            <span>
              Total simulated throughput: <strong>{totalThroughput.toFixed(1)} Mbps</strong> across {devices.length} devices.
              Changing priority redistributes scheduling weight — the total does not increase.
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default Devices;
