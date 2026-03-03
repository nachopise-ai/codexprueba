export type DeviceKind = 'router' | 'pc';

export interface CanvasPosition { x: number; y: number; }

export interface TopologyDevice {
  id: string;
  name: string;
  kind: DeviceKind;
  position: CanvasPosition;
}

export interface TopologyLink {
  id: string;
  aDeviceId: string;
  aPort: string;
  bDeviceId: string;
  bPort: string;
  cableType: 'copper-straight' | 'copper-crossover' | 'fiber';
}

export interface InterfaceConfig {
  name: string;
  ip?: string;
  mask?: string;
  adminUp: boolean;
}

export interface RouterConfig {
  hostname: string;
  interfaces: InterfaceConfig[];
  staticRoutes: Array<{ network: string; mask: string; nextHop: string }>;
}

export interface PcConfig {
  hostname: string;
  nic: InterfaceConfig;
  defaultGateway?: string;
}

export interface DeviceConfigs {
  [deviceId: string]: RouterConfig | PcConfig;
}

export interface NetlabProject {
  version: 1;
  devices: TopologyDevice[];
  links: TopologyLink[];
  deviceConfigs: DeviceConfigs;
  canvasState: { zoom: number; panX: number; panY: number; gridEnabled: boolean };
}

export const createEmptyProject = (): NetlabProject => ({
  version: 1,
  devices: [],
  links: [],
  deviceConfigs: {},
  canvasState: { zoom: 1, panX: 0, panY: 0, gridEnabled: true }
});
