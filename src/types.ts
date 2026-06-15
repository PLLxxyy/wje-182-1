export interface ChargingStation {
  id: string;
  name: string;
  address: string;
  x: number; // grid position 0-19
  y: number; // grid position 0-14
  chargerType: 'fast' | 'slow' | 'both';
  pricePerKwh: number;
  totalGuns: number;
  freeGuns: number;
  busyGuns: number;
  faultGuns: number;
  distance: number; // km from user
  status: 'free' | 'busy' | 'fault';
  guns: GunStatus[];
}

export interface GunStatus {
  id: string;
  type: 'fast' | 'slow';
  status: 'free' | 'in-use' | 'fault';
  power: number; // kW
}

export interface ChargingSession {
  id: string;
  stationId: string;
  stationName: string;
  startTime: number; // timestamp
  endTime: number | null;
  startBattery: number;
  endBattery: number;
  energyUsed: number; // kWh
  duration: number; // seconds
  cost: number;
  pricePerKwh: number;
  status: 'charging' | 'completed' | 'stopped';
}

export interface Feedback {
  id: string;
  stationId: string;
  stationName: string;
  sessionId: string;
  rating: number; // 1-5 stars
  issues: string[];
  content: string;
  createdAt: number;
}

export const FEEDBACK_ISSUES = [
  '充电桩故障',
  '充电速度慢',
  '价格不合理',
  '停车不方便',
  '环境脏乱',
  '网络信号差',
  '安全隐患',
  '其他问题',
] as const;

export type GridCellType = 'empty' | 'road' | 'block' | 'park' | 'water';
