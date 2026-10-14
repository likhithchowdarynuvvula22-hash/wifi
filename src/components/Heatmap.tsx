import React, { useState } from 'react';
import type { Room } from '../types';
import { getSignalColor } from '../engine/diagnostics';

interface HeatmapProps {
  /** Current (possibly initial or already-repositioned) room data. */
  currentRooms: Room[];
  /** Null until the user triggers simulation; then holds computed optimized rooms. */
  optimizedRooms: Room[] | null;
  onSimulate: () => void;
  onReset: () => void;
}

const qualityLabel = (q: string) => {
  if (q === 'Excellent') return { text: 'Excellent', color: '#22c55e' };
  if (q === 'Good')      return { text: 'Good',      color: '#84cc16' };
  if (q === 'Fair')      return { text: 'Fair',      color: '#f59e0b' };
  return                        { text: 'Poor',      color: '#ef4444' };
};

const roomFill = (level: number) => {
  if (level >= 80) return 'rgba(34,197,94,0.25)';
  if (level >= 60) return 'rgba(132,204,18,0.25)';
  if (level >= 40) return 'rgba(245,158,11,0.25)';
  return 'rgba(239,68,68,0.22)';
};

const roomStroke = (level: number) => {
  if (level >= 80) return '#22c55e';
  if (level >= 60) return '#84cc16';
  if (level >= 40) return '#f59e0b';
  return '#ef4444';
};

const Heatmap: React.FC<HeatmapProps> = ({
  currentRooms, optimizedRooms, onSimulate, onReset,
}) => {
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [simulating, setSimulating] = useState(false);

  const showOptimized = optimizedRooms !== null;
  // Display whichever set is active
  const displayRooms = showOptimized ? optimizedRooms! : currentRooms;

  const handleSimulate = () => {
    setSimulating(true);
    // Brief animation delay, then App computes the new coverage
    setTimeout(() => {
      onSimulate();
      setSimulating(false);
    }, 1800);
  };

  const handleReset = () => {
    onReset();
    setSelectedRoomId(null);
  };

  const selectedData = selectedRoomId
    ? displayRooms.find((r) => r.id === selectedRoomId) ?? null
    : null;

  return (
    <div className="section-content">
      <div className="section-header">
        <div>
          <h2 className="section-title">Coverage Heatmap</h2>
          <p className="section-sub">Room-level signal strength visualization · SIMULATED</p>
        </div>
        <div className="heatmap-controls">
          {showOptimized && (
            <span className="optimized-badge">✅ Optimized View</span>
          )}
          {!showOptimized && (
            <button
              id="simulate-router-btn"
              className="apply-btn"
              onClick={handleSimulate}
              disabled={simulating}
              style={{ padding: '8px 16px', fontSize: 13 }}
            >
              {simulating
                ? <><span className="spin">⟳</span> Simulating...</>
                : '📍 Simulate Router Reposition'}
            </button>
          )}
          {showOptimized && (
            <button
              id="reset-heatmap-btn"
              className="reset-btn"
              onClick={handleReset}
            >
              ↺ Reset
            </button>
          )}
        </div>
      </div>

      <div className="heatmap-layout">
        {/* ── Floor plan SVG ── */}
        <div className="floorplan-wrapper">
          <div className="floorplan-title">
            {showOptimized ? '📍 After Router Repositioning (Hallway Centre)' : '📍 Current Router Position (Living Room corner)'}
          </div>
          <svg viewBox="0 0 100 100" className="floorplan-svg" xmlns="http://www.w3.org/2000/svg">
            {/* Background */}
            <rect x="0" y="0" width="100" height="100" fill="#0d1829" rx="2" />

            {/* Rooms */}
            {displayRooms.map((room) => (
              <g
                key={room.id}
                onClick={() => setSelectedRoomId(room.id === selectedRoomId ? null : room.id)}
                style={{ cursor: 'pointer' }}
              >
                <rect
                  x={room.x} y={room.y} width={room.width} height={room.height}
                  fill={roomFill(room.signalLevel)}
                  stroke={room.id === selectedRoomId ? '#38bdf8' : roomStroke(room.signalLevel)}
                  strokeWidth={room.id === selectedRoomId ? 1.5 : 0.8}
                  rx="1"
                  style={{ transition: 'fill 0.6s ease, stroke 0.3s ease' }}
                />
                <text
                  x={room.x + room.width / 2} y={room.y + room.height / 2 - 4}
                  textAnchor="middle" fill="#e2e8f0" fontSize="4.5" fontWeight="600"
                >
                  {room.name}
                </text>
                <text
                  x={room.x + room.width / 2} y={room.y + room.height / 2 + 6}
                  textAnchor="middle" fill={roomStroke(room.signalLevel)} fontSize="5" fontWeight="700"
                >
                  {room.signalLevel}%
                </text>
              </g>
            ))}

            {/* Router / AP marker — moves between positions */}
            <g transform={showOptimized ? 'translate(45,50)' : 'translate(18,28)'} style={{ transition: 'transform 1s ease' }}>
              <circle r="4" fill="#38bdf8" opacity="0.2">
                <animate attributeName="r" values="4;6;4" dur="2s" repeatCount="indefinite" />
              </circle>
              <circle r="2.5" fill="#38bdf8" />
              <text y="7" textAnchor="middle" fill="#38bdf8" fontSize="3" fontWeight="600">AP</text>
            </g>

            {/* Legend */}
            {[
              { color: '#22c55e', label: 'Excellent' },
              { color: '#84cc16', label: 'Good' },
              { color: '#f59e0b', label: 'Fair' },
              { color: '#ef4444', label: 'Poor' },
            ].map((item, i) => (
              <g key={item.label} transform={`translate(2, ${i * 6 + 2})`}>
                <rect width="4" height="4" fill={item.color} rx="0.5" opacity="0.7" />
                <text x="5.5" y="3.5" fill="#94a3b8" fontSize="3">{item.label}</text>
              </g>
            ))}
          </svg>
        </div>

        {/* ── Room details panel ── */}
        <div className="room-details-panel">
          <div className="panel-title">📶 Room Signal Details</div>
          <div className="room-list">
            {displayRooms.map((room) => {
              const q = qualityLabel(room.signalQuality);
              // Compare against currentRooms (not optimizedRooms) for delta display
              const origRoom = currentRooms.find((r) => r.id === room.id)!;
              const delta = showOptimized ? room.signalLevel - origRoom.signalLevel : 0;

              return (
                <div
                  key={room.id}
                  id={`room-${room.id}`}
                  className={`room-item ${selectedRoomId === room.id ? 'selected' : ''}`}
                  onClick={() => setSelectedRoomId(room.id === selectedRoomId ? null : room.id)}
                >
                  <div className="room-item-header">
                    <span className="room-name">{room.name}</span>
                    <span className="room-quality" style={{ color: q.color }}>{q.text}</span>
                  </div>
                  <div className="room-signal-bar-bg">
                    <div
                      className="room-signal-bar-fill"
                      style={{
                        width: `${room.signalLevel}%`,
                        background: getSignalColor(room.signalLevel),
                        transition: 'width 0.8s ease',
                      }}
                    />
                  </div>
                  <div className="room-signal-meta">
                    <span style={{ color: q.color }}>{room.signalLevel}% signal</span>
                    {showOptimized && delta !== 0 && (
                      <span className={delta > 0 ? 'delta-good' : 'delta-bad'}>
                        {delta > 0 ? '+' : ''}{delta}%
                      </span>
                    )}
                    <span className="room-distance">~{room.distanceFromRouter}m from AP</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Selected room detail card */}
          {selectedData && (
            <div className="room-detail-box">
              <div className="room-detail-title">{selectedData.name} — Details</div>
              <div className="room-detail-row">
                <span>Signal Level</span>
                <span style={{ color: getSignalColor(selectedData.signalLevel) }}>{selectedData.signalLevel}%</span>
              </div>
              <div className="room-detail-row">
                <span>Quality</span>
                <span style={{ color: qualityLabel(selectedData.signalQuality).color }}>{selectedData.signalQuality}</span>
              </div>
              <div className="room-detail-row">
                <span>Distance from AP</span>
                <span>~{selectedData.distanceFromRouter}m</span>
              </div>
              <div className="room-detail-row">
                <span>Est. RSSI</span>
                <span>~{Math.round(-30 - selectedData.distanceFromRouter * 5)} dBm</span>
              </div>
              {showOptimized && (() => {
                const orig = currentRooms.find((r) => r.id === selectedData.id)!;
                const d = selectedData.signalLevel - orig.signalLevel;
                return d !== 0 ? (
                  <div className="room-detail-row">
                    <span>Signal Change</span>
                    <span className={d > 0 ? 'delta-good' : 'delta-bad'}>
                      {d > 0 ? '+' : ''}{d}%
                    </span>
                  </div>
                ) : null;
              })()}
              {selectedData.signalQuality === 'Poor' && !showOptimized && (
                <div className="room-action-hint">
                  ⚠️ Coverage insufficient. Try simulating router repositioning above.
                </div>
              )}
            </div>
          )}

          {/* Summary card after optimization */}
          {showOptimized && (() => {
            const improved = displayRooms.filter((r) => {
              const orig = currentRooms.find((o) => o.id === r.id)!;
              return r.signalLevel > orig.signalLevel;
            });
            const avgDelta = Math.round(
              displayRooms.reduce((sum, r) => {
                const orig = currentRooms.find((o) => o.id === r.id)!;
                return sum + (r.signalLevel - orig.signalLevel);
              }, 0) / displayRooms.length,
            );
            return (
              <div className="verification-card improved" style={{ marginTop: 16 }}>
                <div className="verification-title">✅ Coverage Recalculated</div>
                <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 8, lineHeight: 1.6 }}>
                  {improved.length}/{displayRooms.length} rooms improved.
                  Average signal change: <strong style={{ color: '#22c55e' }}>+{avgDelta}%</strong>.
                  Router repositioned to hallway centre — more uniform coverage across all rooms.
                </div>
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
};

export default Heatmap;
