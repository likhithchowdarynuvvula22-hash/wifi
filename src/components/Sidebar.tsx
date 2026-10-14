import React from 'react';
import type { NavSection } from '../types';

interface SidebarProps {
  activeSection: NavSection;
  onNavigate: (section: NavSection) => void;
}

const navItems: { id: NavSection; label: string; icon: string; description: string }[] = [
  { id: 'overview', label: 'Overview', icon: '◉', description: 'Network metrics & health' },
  { id: 'diagnosis', label: 'Smart Diagnosis', icon: '🧠', description: 'AI-powered analysis' },
  { id: 'devices', label: 'Devices', icon: '📱', description: 'Band & priority management' },
  { id: 'heatmap', label: 'Coverage Map', icon: '🗺', description: 'Room-level signal view' },
  { id: 'history', label: 'Action History', icon: '📋', description: 'Applied changes log' },
  { id: 'testing', label: 'System Verification', icon: '🧪', description: 'Automated tests & benchmarks' },
];

const Sidebar: React.FC<SidebarProps> = ({ activeSection, onNavigate }) => {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="brand-icon">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M1 6c0 0 5-4 11-4s11 4 11 4" />
            <path d="M5 10c0 0 3-2.5 7-2.5s7 2.5 7 2.5" />
            <path d="M9 14c0 0 1-1 3-1s3 1 3 1" />
            <circle cx="12" cy="18" r="1.5" fill="currentColor" />
          </svg>
        </div>
        <div>
          <div className="brand-name">WiFiMind</div>
          <div className="brand-sub">Intelligent Recovery</div>
        </div>
      </div>

      <div className="sidebar-section-label">NAVIGATION</div>
      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <button
            key={item.id}
            id={`nav-${item.id}`}
            className={`nav-item ${activeSection === item.id ? 'active' : ''}`}
            onClick={() => onNavigate(item.id)}
          >
            <span className="nav-icon">{item.icon}</span>
            <div className="nav-text">
              <span className="nav-label">{item.label}</span>
              <span className="nav-desc">{item.description}</span>
            </div>
            {activeSection === item.id && <span className="nav-indicator" />}
          </button>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="sim-badge">
          <span className="sim-dot" />
          SIMULATION MODE
        </div>
        <div className="sim-note">No real hardware connected</div>
      </div>
    </aside>
  );
};

export default Sidebar;
