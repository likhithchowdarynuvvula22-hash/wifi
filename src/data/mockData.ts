import type { NetworkMetrics, Device, DiagnosisResult, Room, Scenario } from '../types';

export const SCENARIO_METRICS: Record<Scenario, NetworkMetrics> = {
  A: {
    healthScore: 42,
    throughput: 18,
    latency: 145,
    packetLoss: 3.2,
    channelUtilization: 88,
    connectedDevices: 12,
    band24: 70,
    band5: 30,
    upstreamStatus: 'healthy',
  },
  B: {
    healthScore: 35,
    throughput: 8,
    latency: 220,
    packetLoss: 6.1,
    channelUtilization: 34,
    connectedDevices: 7,
    band24: 85,
    band5: 15,
    upstreamStatus: 'healthy',
  },
  C: {
    healthScore: 55,
    throughput: 62,
    latency: 95,
    packetLoss: 1.8,
    channelUtilization: 76,
    connectedDevices: 9,
    band24: 55,
    band5: 45,
    upstreamStatus: 'healthy',
  },
  D: {
    healthScore: 20,
    throughput: 0,
    latency: 9999,
    packetLoss: 100,
    channelUtilization: 12,
    connectedDevices: 8,
    band24: 60,
    band5: 40,
    upstreamStatus: 'failed',
  },
};

export const SCENARIO_AFTER_METRICS: Record<Scenario, Partial<NetworkMetrics>> = {
  A: {
    healthScore: 78,
    throughput: 52,
    latency: 38,
    packetLoss: 0.4,
    channelUtilization: 41,
  },
  B: {
    healthScore: 68,
    throughput: 34,
    latency: 82,
    packetLoss: 1.2,
    channelUtilization: 38,
  },
  C: {
    healthScore: 82,
    throughput: 62,
    latency: 22,
    packetLoss: 0.3,
    channelUtilization: 76,
  },
  D: {
    healthScore: 20,
    throughput: 0,
    latency: 9999,
    packetLoss: 100,
    channelUtilization: 12,
  },
};

export const DIAGNOSIS_RESULTS: Record<Scenario, DiagnosisResult> = {
  A: {
    scenario: 'A',
    symptoms: [
      'Channel utilization at 88% — severely congested',
      'Latency spiked to 145ms (threshold: 50ms)',
      'Throughput degraded to 18 Mbps despite capable hardware',
      'Upstream ISP connection is healthy (no ISP fault)',
      '70% of devices crowded on 2.4 GHz',
    ],
    rootCause: 'Wi-Fi Channel Congestion — 2.4 GHz band saturated by overlapping traffic',
    evidence: [
      { metric: 'Channel Utilization', value: '88%', threshold: '< 60%', status: 'critical' },
      { metric: 'Latency', value: '145ms', threshold: '< 50ms', status: 'critical' },
      { metric: 'Throughput', value: '18 Mbps', threshold: '> 40 Mbps', status: 'critical' },
      { metric: 'Upstream Status', value: 'Healthy', threshold: 'Healthy', status: 'ok' },
      { metric: 'Packet Loss', value: '3.2%', threshold: '< 1%', status: 'warning' },
    ],
    confidence: 92,
    confidenceExplanation:
      'High confidence: channel utilization alone explains the latency and throughput degradation. Upstream is healthy, ruling out ISP fault. Signal strength is adequate, ruling out coverage as root cause.',
    recommendedAction: 'Switch primary AP to a non-overlapping channel (e.g., Ch 6 or Ch 11) and enable automatic band steering to migrate capable devices to 5 GHz',
    actionExplanation:
      'Reducing channel congestion directly addresses the bottleneck. Band steering moves capable devices to the less crowded 5 GHz band, freeing 2.4 GHz capacity for devices that require it.',
    alternativeRejected:
      'Adding an access point (Scenario B solution) would not help here — coverage is adequate. The problem is too many devices competing on an oversaturated channel, not signal attenuation.',
    expectedOutcome:
      'Channel utilization drops to ~40%. Latency improves to under 40ms. Throughput increases to 50+ Mbps. Overall health score rises from 42 to ~78.',
  },
  B: {
    scenario: 'B',
    symptoms: [
      'Throughput critically low at 8 Mbps despite healthy upstream',
      'Latency elevated at 220ms — not explained by congestion',
      'Channel utilization only 34% — channel is not congested',
      'Packet loss at 6.1% — characteristic of weak RF signal',
      '85% of devices on 2.4 GHz — low adoption of 5 GHz',
    ],
    rootCause: 'Weak Signal Coverage — devices too far from the router or obstructed by walls/interference',
    evidence: [
      { metric: 'Throughput', value: '8 Mbps', threshold: '> 40 Mbps', status: 'critical' },
      { metric: 'Packet Loss', value: '6.1%', threshold: '< 1%', status: 'critical' },
      { metric: 'Channel Utilization', value: '34%', threshold: '< 60%', status: 'ok' },
      { metric: 'Latency', value: '220ms', threshold: '< 50ms', status: 'critical' },
      { metric: 'Upstream Status', value: 'Healthy', threshold: 'Healthy', status: 'ok' },
    ],
    confidence: 89,
    confidenceExplanation:
      'High confidence: low throughput with low channel utilization is the hallmark of poor signal quality, not congestion. High packet loss confirms RF signal degradation rather than bandwidth saturation.',
    recommendedAction: 'Reposition the router to a more central location or deploy an additional access point (mesh node) in the low-coverage area',
    actionExplanation:
      'The signal attenuation pattern indicates the router is too far from affected devices or obstructed by physical barriers. Moving the router or adding a mesh node directly reduces path loss.',
    alternativeRejected:
      'Switching to 5 GHz would worsen the situation — 5 GHz has shorter range and penetrates walls less effectively. This would increase packet loss further. 2.4 GHz is the correct band for extended-range coverage.',
    expectedOutcome:
      'Packet loss drops from 6.1% to under 2%. Throughput improves from 8 Mbps to 30+ Mbps. Latency reduces to under 90ms. Health score rises from 35 to ~68.',
  },
  C: {
    scenario: 'C',
    symptoms: [
      'Smart TV consuming 48 Mbps — 77% of total available bandwidth',
      'Latency on other devices elevated to 95ms',
      'Laptop and smartphone experiencing QoS starvation',
      'Channel utilization at 76% — driven by single heavy consumer',
      'Upstream and Wi-Fi signal are both healthy',
    ],
    rootCause: 'Bandwidth Monopolization — single device (Smart TV) starving other devices of network resources',
    evidence: [
      { metric: 'Smart TV Bandwidth', value: '48 Mbps (77%)', threshold: '< 50% share', status: 'critical' },
      { metric: 'Channel Utilization', value: '76%', threshold: '< 60%', status: 'warning' },
      { metric: 'Latency (other devices)', value: '95ms', threshold: '< 50ms', status: 'warning' },
      { metric: 'Packet Loss', value: '1.8%', threshold: '< 1%', status: 'warning' },
      { metric: 'Upstream Status', value: 'Healthy', threshold: 'Healthy', status: 'ok' },
    ],
    confidence: 94,
    confidenceExplanation:
      'Very high confidence: telemetry clearly identifies a single device consuming disproportionate bandwidth while others exhibit latency symptoms. This is a textbook QoS prioritization scenario.',
    recommendedAction: 'Apply QoS rule: set Smart TV to Normal priority, Laptop to Critical, Smartphone to High. This allocates bandwidth proportionally based on task urgency.',
    actionExplanation:
      'QoS rules instruct the router to schedule packets from higher-priority devices first. The Smart TV, which is streaming (latency-tolerant), can buffer. Work devices (laptop) require consistent low-latency throughput.',
    alternativeRejected:
      'Changing Wi-Fi channels or adding APs would not resolve this issue — the bottleneck is bandwidth allocation policy, not channel congestion or coverage. QoS is the correct layer-2/3 intervention.',
    expectedOutcome:
      'Laptop and smartphone latency drops to under 25ms. Smart TV continues streaming with acceptable buffering. Overall QoS fairness improves. Health score rises from 55 to ~82.',
  },
  D: {
    scenario: 'D',
    symptoms: [
      'Complete internet connectivity failure — 100% packet loss to internet',
      'Local Wi-Fi network is healthy (devices connect normally)',
      'Channel utilization only 12% — very low, confirming local traffic only',
      'Signal strength on all devices is normal',
      'DHCP and local DNS resolving correctly',
    ],
    rootCause: 'ISP / Gateway Failure — the upstream connection beyond the modem is down',
    evidence: [
      { metric: 'Internet Packet Loss', value: '100%', threshold: '< 1%', status: 'critical' },
      { metric: 'Upstream Status', value: 'FAILED', threshold: 'Healthy', status: 'critical' },
      { metric: 'Channel Utilization', value: '12%', threshold: '< 60%', status: 'ok' },
      { metric: 'Local Connectivity', value: 'Working', threshold: 'Working', status: 'ok' },
      { metric: 'DHCP', value: 'Assigning addresses', threshold: 'Active', status: 'ok' },
    ],
    confidence: 97,
    confidenceExplanation:
      'Very high confidence: local Wi-Fi is working perfectly. The fault is exclusively upstream. Modifying Wi-Fi settings would have zero effect on this failure mode.',
    recommendedAction: 'Do NOT change Wi-Fi settings. Check physical modem connections, restart the modem (power cycle), and contact your ISP if the issue persists.',
    actionExplanation:
      'The diagnostic engine has isolated the failure to the WAN side. Troubleshooting the modem and ISP connection is the only effective action. Wi-Fi changes would waste time and may introduce new issues.',
    alternativeRejected:
      'Changing Wi-Fi channels, band steering, or QoS would have zero effect on a WAN outage. These interventions operate at the local RF layer and cannot restore a failed ISP connection.',
    expectedOutcome:
      'After modem restart: connectivity typically restores within 2-5 minutes if it is a transient fault. If it persists, ISP must investigate the line. Local Wi-Fi requires no changes.',
  },
};

export const SCENARIO_LABELS: Record<Scenario, string> = {
  A: 'Scenario A — Channel Congestion',
  B: 'Scenario B — Weak Coverage',
  C: 'Scenario C — Bandwidth Hog',
  D: 'Scenario D — ISP Failure',
};

export const SCENARIO_ICONS: Record<Scenario, string> = {
  A: '📡',
  B: '📶',
  C: '🎥',
  D: '🔴',
};

export const DEVICES: Device[] = [
  {
    id: 'd1',
    name: "Alex's MacBook Pro",
    type: 'laptop',
    band: '2.4GHz',
    signalStrength: 'Good',
    rssi: -62,
    throughput: 8.4,
    priority: 'High',
    recommendedBand: '5GHz',
    bandAssigned: false,
    macAddress: 'A4:83:E7:12:34:56',
    ipAddress: '192.168.1.101',
    manufacturer: 'Apple Inc.',
  },
  {
    id: 'd2',
    name: 'Galaxy S24 Ultra',
    type: 'smartphone',
    band: '5GHz',
    signalStrength: 'Excellent',
    rssi: -48,
    throughput: 12.1,
    priority: 'Normal',
    recommendedBand: '5GHz',
    bandAssigned: true,
    macAddress: 'B8:27:EB:AB:CD:EF',
    ipAddress: '192.168.1.102',
    manufacturer: 'Samsung Electronics',
  },
  {
    id: 'd3',
    name: 'Samsung QLED TV',
    type: 'tv',
    band: '5GHz',
    signalStrength: 'Good',
    rssi: -58,
    throughput: 48.0,
    priority: 'Normal',
    recommendedBand: '5GHz',
    bandAssigned: true,
    macAddress: 'C4:9A:02:DE:AD:11',
    ipAddress: '192.168.1.103',
    manufacturer: 'Samsung Electronics',
  },
  {
    id: 'd4',
    name: 'Guest iPhone 15',
    type: 'guest',
    band: '2.4GHz',
    signalStrength: 'Fair',
    rssi: -72,
    throughput: 3.2,
    priority: 'Low',
    recommendedBand: '2.4GHz',
    bandAssigned: false,
    macAddress: 'F0:18:98:11:22:33',
    ipAddress: '192.168.1.200',
    manufacturer: 'Apple Inc.',
  },
  {
    id: 'd5',
    name: 'Nest Thermostat',
    type: 'iot',
    band: '2.4GHz',
    signalStrength: 'Good',
    rssi: -61,
    throughput: 0.1,
    priority: 'Low',
    recommendedBand: '2.4GHz',
    bandAssigned: true,
    macAddress: '18:B4:30:00:AA:BB',
    ipAddress: '192.168.1.150',
    manufacturer: 'Google LLC',
  },
  {
    id: 'd6',
    name: "Sarah's iPad Pro",
    type: 'tablet',
    band: '2.4GHz',
    signalStrength: 'Fair',
    rssi: -74,
    throughput: 5.6,
    priority: 'Normal',
    recommendedBand: '5GHz',
    bandAssigned: false,
    macAddress: 'D8:30:62:CC:DD:EE',
    ipAddress: '192.168.1.104',
    manufacturer: 'Apple Inc.',
  },
];

export const INITIAL_ROOMS: Room[] = [
  { id: 'living', name: 'Living Room', x: 10, y: 10, width: 35, height: 40, signalLevel: 95, signalQuality: 'Excellent', distanceFromRouter: 1 },
  { id: 'study', name: 'Study Room', x: 55, y: 10, width: 35, height: 35, signalLevel: 72, signalQuality: 'Good', distanceFromRouter: 5 },
  { id: 'bedroom', name: 'Bedroom', x: 55, y: 55, width: 35, height: 35, signalLevel: 48, signalQuality: 'Fair', distanceFromRouter: 9 },
  { id: 'kitchen', name: 'Kitchen', x: 10, y: 60, width: 25, height: 30, signalLevel: 38, signalQuality: 'Poor', distanceFromRouter: 10 },
  { id: 'hallway', name: 'Hallway', x: 35, y: 40, width: 20, height: 20, signalLevel: 62, signalQuality: 'Good', distanceFromRouter: 6 },
];

export const OPTIMIZED_ROOMS: Room[] = [
  { id: 'living', name: 'Living Room', x: 10, y: 10, width: 35, height: 40, signalLevel: 88, signalQuality: 'Excellent', distanceFromRouter: 3 },
  { id: 'study', name: 'Study Room', x: 55, y: 10, width: 35, height: 35, signalLevel: 91, signalQuality: 'Excellent', distanceFromRouter: 2 },
  { id: 'bedroom', name: 'Bedroom', x: 55, y: 55, width: 35, height: 35, signalLevel: 78, signalQuality: 'Good', distanceFromRouter: 5 },
  { id: 'kitchen', name: 'Kitchen', x: 10, y: 60, width: 25, height: 30, signalLevel: 71, signalQuality: 'Good', distanceFromRouter: 6 },
  { id: 'hallway', name: 'Hallway', x: 35, y: 40, width: 20, height: 20, signalLevel: 85, signalQuality: 'Excellent', distanceFromRouter: 1 },
];
