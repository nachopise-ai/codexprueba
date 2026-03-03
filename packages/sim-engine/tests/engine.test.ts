import { describe, expect, it } from 'vitest';
import { simulatePing } from '../src/index';
import type { NetlabProject } from '@netlab/common';

const project: NetlabProject = {
  version: 1,
  devices: [
    { id: 'pc1', kind: 'pc', name: 'PC1', position: { x: 0, y: 0 } },
    { id: 'r1', kind: 'router', name: 'R1', position: { x: 0, y: 0 } },
    { id: 'r2', kind: 'router', name: 'R2', position: { x: 0, y: 0 } },
    { id: 'pc2', kind: 'pc', name: 'PC2', position: { x: 0, y: 0 } }
  ],
  links: [
    { id: 'l1', aDeviceId: 'pc1', aPort: 'NIC0', bDeviceId: 'r1', bPort: 'e0/0', cableType: 'copper-straight' },
    { id: 'l2', aDeviceId: 'r1', aPort: 'e0/1', bDeviceId: 'r2', bPort: 'e0/0', cableType: 'copper-straight' },
    { id: 'l3', aDeviceId: 'r2', aPort: 'e0/1', bDeviceId: 'pc2', bPort: 'NIC0', cableType: 'copper-straight' }
  ],
  deviceConfigs: {
    pc1: { hostname: 'PC1', nic: { name: 'NIC0', ip: '10.0.0.2', mask: '255.255.255.0', adminUp: true }, defaultGateway: '10.0.0.1' },
    r1: {
      hostname: 'R1',
      interfaces: [
        { name: 'e0/0', ip: '10.0.0.1', mask: '255.255.255.0', adminUp: true },
        { name: 'e0/1', ip: '192.168.0.1', mask: '255.255.255.0', adminUp: true }
      ],
      staticRoutes: [{ network: '20.0.0.0', mask: '255.255.255.0', nextHop: '192.168.0.2' }]
    },
    r2: {
      hostname: 'R2',
      interfaces: [
        { name: 'e0/0', ip: '192.168.0.2', mask: '255.255.255.0', adminUp: true },
        { name: 'e0/1', ip: '20.0.0.1', mask: '255.255.255.0', adminUp: true }
      ],
      staticRoutes: [{ network: '10.0.0.0', mask: '255.255.255.0', nextHop: '192.168.0.1' }]
    },
    pc2: { hostname: 'PC2', nic: { name: 'NIC0', ip: '20.0.0.2', mask: '255.255.255.0', adminUp: true }, defaultGateway: '20.0.0.1' }
  },
  canvasState: { zoom: 1, panX: 0, panY: 0, gridEnabled: true }
};

describe('sim engine ping', () => {
  it('reaches remote host through static routes', () => {
    const result = simulatePing(project, project.deviceConfigs, 'pc1', '20.0.0.2');
    expect(result.success).toBe(true);
  });
});
