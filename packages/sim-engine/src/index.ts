import type { DeviceConfigs, NetlabProject, PcConfig, RouterConfig, TopologyDevice } from '@netlab/common';

export interface SimulationEvent { tick: number; message: string; path?: string[] }

const ipToInt = (ip: string) => ip.split('.').reduce((a, o) => (a << 8) + Number(o), 0) >>> 0;
const maskMatch = (ip: string, network: string, mask: string) => (ipToInt(ip) & ipToInt(mask)) === (ipToInt(network) & ipToInt(mask));

function getConnectedRoutes(cfg: RouterConfig) {
  return cfg.interfaces
    .filter((i) => i.adminUp && i.ip && i.mask)
    .map((i) => ({ network: i.ip!, mask: i.mask!, nextHop: 'connected' }));
}

function findDeviceByIp(project: NetlabProject, configs: DeviceConfigs, ip: string): TopologyDevice | undefined {
  return project.devices.find((d) => {
    const cfg = configs[d.id] as RouterConfig | PcConfig | undefined;
    if (!cfg) return false;
    if ('nic' in cfg) return cfg.nic.ip === ip;
    return cfg.interfaces.some((i) => i.ip === ip);
  });
}

function getLocalRouterForPc(project: NetlabProject, pcId: string): string | undefined {
  const link = project.links.find((l) => l.aDeviceId === pcId || l.bDeviceId === pcId);
  if (!link) return undefined;
  return link.aDeviceId === pcId ? link.bDeviceId : link.aDeviceId;
}

function findNextHopRouter(project: NetlabProject, configs: DeviceConfigs, routerId: string, dstIp: string): string | undefined {
  const cfg = configs[routerId] as RouterConfig | undefined;
  if (!cfg) return undefined;
  const connected = getConnectedRoutes(cfg).find((r) => maskMatch(dstIp, r.network, r.mask));
  if (connected) {
    return findDeviceByIp(project, configs, dstIp)?.id;
  }
  const staticRoute = cfg.staticRoutes.find((r) => maskMatch(dstIp, r.network, r.mask));
  if (!staticRoute) return undefined;
  return findDeviceByIp(project, configs, staticRoute.nextHop)?.id;
}

export function simulatePing(project: NetlabProject, configs: DeviceConfigs, srcId: string, dstIp: string): { success: boolean; events: SimulationEvent[] } {
  const events: SimulationEvent[] = [{ tick: 0, message: `ICMP echo request from ${srcId} to ${dstIp}` }];
  const srcCfg = configs[srcId] as PcConfig | RouterConfig | undefined;
  if (!srcCfg) return { success: false, events: [...events, { tick: 1, message: 'Source not configured' }] };

  let currentId = srcId;
  const visited = new Set<string>();
  const path = [srcId];

  if ('nic' in srcCfg) {
    const firstHop = getLocalRouterForPc(project, srcId);
    if (!firstHop) return { success: false, events: [...events, { tick: 1, message: 'PC without uplink' }] };
    currentId = firstHop;
    path.push(firstHop);
  }

  for (let tick = 1; tick < 16; tick++) {
    if (visited.has(currentId)) return { success: false, events: [...events, { tick, message: 'Loop detected', path }] };
    visited.add(currentId);

    const target = findDeviceByIp(project, configs, dstIp);
    if (target?.id === currentId) {
      return { success: true, events: [...events, { tick, message: 'Echo reply received', path }] };
    }

    const nextHop = findNextHopRouter(project, configs, currentId, dstIp);
    if (!nextHop) return { success: false, events: [...events, { tick, message: `No route to ${dstIp}`, path }] };
    currentId = nextHop;
    path.push(nextHop);
    events.push({ tick, message: `Forwarded to ${nextHop}`, path: [...path] });

    if (target?.id === nextHop) {
      return { success: true, events: [...events, { tick: tick + 1, message: 'Echo reply received', path }] };
    }
  }

  return { success: false, events: [...events, { tick: 16, message: 'TTL exceeded', path }] };
}

type Mode = 'user' | 'privileged' | 'config' | 'interface';

export interface CliSessionState { mode: Mode; selectedInterface?: string; }
export interface CliResult { output: string[]; state: CliSessionState; }

interface CliContext { config: RouterConfig | PcConfig; state: CliSessionState; }

type Handler = (tokens: string[], ctx: CliContext) => string[];
interface CommandNode { token: string; children?: CommandNode[]; handler?: Handler; }

const cmd = (token: string, children: CommandNode[] = [], handler?: Handler): CommandNode => ({ token, children, handler });

const showIpRoute: Handler = (_t, ctx) => {
  if ('nic' in ctx.config) return ['PC route: default via ' + (ctx.config.defaultGateway ?? 'none')];
  return ctx.config.staticRoutes.map((r) => `${r.network} ${r.mask} via ${r.nextHop}`);
};

const commandTree: CommandNode[] = [
  cmd('enable', [], (_t, ctx) => { ctx.state.mode = 'privileged'; return ['Entered privileged mode']; }),
  cmd('configure', [cmd('terminal', [], (_t, ctx) => { ctx.state.mode = 'config'; return ['Enter configuration mode']; })]),
  cmd('interface', [], (t, ctx) => {
    if (ctx.state.mode !== 'config' || !t[1]) return ['Invalid interface context'];
    ctx.state.mode = 'interface';
    ctx.state.selectedInterface = t[1];
    return [`Configuring interface ${t[1]}`];
  }),
  cmd('ip', [
    cmd('address', [], (t, ctx) => {
      if (ctx.state.mode !== 'interface' || !('interfaces' in ctx.config)) return ['ip address only in interface mode'];
      const iface = ctx.config.interfaces.find((i) => i.name === ctx.state.selectedInterface);
      if (!iface) return ['Interface not found'];
      iface.ip = t[2]; iface.mask = t[3];
      return [`Assigned ${t[2]} ${t[3]} to ${iface.name}`];
    }),
    cmd('route', [], (t, ctx) => {
      if (!('interfaces' in ctx.config)) return ['Not a router'];
      ctx.config.staticRoutes.push({ network: t[2], mask: t[3], nextHop: t[4] });
      return ['Static route added'];
    })
  ]),
  cmd('shutdown', [], (_t, ctx) => {
    if (ctx.state.mode !== 'interface' || !('interfaces' in ctx.config)) return ['Only in interface mode'];
    const iface = ctx.config.interfaces.find((i) => i.name === ctx.state.selectedInterface);
    if (!iface) return ['Interface not found'];
    iface.adminUp = false;
    return ['Interface administratively down'];
  }),
  cmd('no', [cmd('shutdown', [], (_t, ctx) => {
    if (ctx.state.mode !== 'interface' || !('interfaces' in ctx.config)) return ['Only in interface mode'];
    const iface = ctx.config.interfaces.find((i) => i.name === ctx.state.selectedInterface);
    if (!iface) return ['Interface not found'];
    iface.adminUp = true;
    return ['Interface enabled'];
  })]),
  cmd('show', [
    cmd('ip', [cmd('route', [], showIpRoute)]),
    cmd('interfaces', [], (_t, ctx) => 'nic' in ctx.config ? [JSON.stringify(ctx.config.nic)] : ctx.config.interfaces.map((i) => `${i.name} ${i.ip ?? 'unassigned'} ${i.adminUp ? 'up' : 'down'}`))
  ]),
  cmd('ping', [], (t) => [`Use test tool for ping ${t[1]}`]),
  cmd('exit', [], (_t, ctx) => {
    if (ctx.state.mode === 'interface') ctx.state.mode = 'config';
    else if (ctx.state.mode === 'config') ctx.state.mode = 'privileged';
    else if (ctx.state.mode === 'privileged') ctx.state.mode = 'user';
    return ['Exit'];
  }),
  cmd('end', [], (_t, ctx) => { ctx.state.mode = 'privileged'; return ['End']; })
];

export function executeCliCommand(input: string, config: RouterConfig | PcConfig, state: CliSessionState): CliResult {
  const tokens = input.trim().split(/\s+/);
  if (!tokens[0]) return { output: [], state };

  const walk = (nodes: CommandNode[], idx: number): Handler | undefined => {
    const node = nodes.find((n) => n.token === tokens[idx]);
    if (!node) return undefined;
    if (idx === tokens.length - 1 && node.handler) return node.handler;
    if (node.children?.length) return walk(node.children, idx + 1) ?? node.handler;
    return node.handler;
  };

  const handler = walk(commandTree, 0);
  if (!handler) return { output: ['% Unknown command'], state };
  const output = handler(tokens, { config, state });
  return { output, state };
}
