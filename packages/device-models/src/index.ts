import type { PcConfig, RouterConfig } from '@netlab/common';

export const defaultRouterConfig = (hostname: string): RouterConfig => ({
  hostname,
  interfaces: [
    { name: 'e0/0', adminUp: false },
    { name: 'e0/1', adminUp: false }
  ],
  staticRoutes: []
});

export const defaultPcConfig = (hostname: string): PcConfig => ({
  hostname,
  nic: { name: 'NIC0', adminUp: true },
  defaultGateway: undefined
});

export const routerPorts = ['e0/0', 'e0/1'] as const;
export const pcPorts = ['NIC0'] as const;
