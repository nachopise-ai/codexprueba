import { describe, expect, it } from 'vitest';
import { executeCliCommand } from '../src/index';
import type { RouterConfig } from '@netlab/common';

const mkRouter = (): RouterConfig => ({
  hostname: 'R1',
  interfaces: [{ name: 'e0/0', adminUp: false }],
  staticRoutes: []
});

describe('cli parser', () => {
  it('configures interface ip and shutdown state', () => {
    const cfg = mkRouter();
    const state = { mode: 'user' as const };
    executeCliCommand('enable', cfg, state);
    executeCliCommand('configure terminal', cfg, state);
    executeCliCommand('interface e0/0', cfg, state);
    executeCliCommand('ip address 10.0.0.1 255.255.255.0', cfg, state);
    executeCliCommand('no shutdown', cfg, state);

    expect(cfg.interfaces[0].ip).toBe('10.0.0.1');
    expect(cfg.interfaces[0].adminUp).toBe(true);
  });

  it('adds static routes', () => {
    const cfg = mkRouter();
    const state = { mode: 'config' as const };
    executeCliCommand('ip route 0.0.0.0 0.0.0.0 10.0.0.2', cfg, state);
    expect(cfg.staticRoutes).toHaveLength(1);
  });
});
