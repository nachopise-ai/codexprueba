import { create } from 'zustand';
import { createEmptyProject, type DeviceKind, type NetlabProject } from '@netlab/common';
import { defaultPcConfig, defaultRouterConfig } from '@netlab/device-models';
import { executeCliCommand, simulatePing } from '@netlab/sim-engine';

interface Store {
  project: NetlabProject;
  selectedId?: string;
  linkStart?: string;
  logs: string[];
  cliState: Record<string, { mode: 'user' | 'privileged' | 'config' | 'interface'; selectedInterface?: string }>;
  addDevice: (kind: DeviceKind, x: number, y: number) => void;
  moveDevice: (id: string, x: number, y: number) => void;
  select: (id?: string) => void;
  startLink: (id: string) => void;
  completeLink: (id: string) => void;
  runPing: (srcId: string, dstIp: string) => void;
  runCli: (id: string, cmd: string) => string[];
  saveProject: () => string;
  loadProject: (text: string) => void;
}

const id = () => Math.random().toString(36).slice(2, 9);

export const useStore = create<Store>((set, get) => ({
  project: createEmptyProject(),
  logs: [],
  cliState: {},
  addDevice: (kind, x, y) => set((s) => {
    const deviceId = id();
    const name = `${kind.toUpperCase()}-${s.project.devices.length + 1}`;
    s.project.devices.push({ id: deviceId, kind, name, position: { x, y } });
    s.project.deviceConfigs[deviceId] = kind === 'router' ? defaultRouterConfig(name) : defaultPcConfig(name);
    return { project: { ...s.project } };
  }),
  moveDevice: (id, x, y) => set((s) => ({ project: { ...s.project, devices: s.project.devices.map((d) => d.id === id ? { ...d, position: { x, y } } : d) } })),
  select: (id) => set({ selectedId: id }),
  startLink: (id) => set({ linkStart: id }),
  completeLink: (id) => set((s) => {
    if (!s.linkStart || s.linkStart === id) return { linkStart: undefined };
    const exists = s.project.links.some((l) => (l.aDeviceId === s.linkStart && l.bDeviceId === id) || (l.bDeviceId === s.linkStart && l.aDeviceId === id));
    if (exists) return { linkStart: undefined };
    s.project.links.push({ id: `link-${Date.now()}`, aDeviceId: s.linkStart, aPort: 'auto', bDeviceId: id, bPort: 'auto', cableType: 'copper-straight' });
    return { project: { ...s.project }, linkStart: undefined };
  }),
  runPing: (srcId, dstIp) => set((s) => {
    const result = simulatePing(s.project, s.project.deviceConfigs, srcId, dstIp);
    return { logs: [...s.logs, ...result.events.map((e) => `${e.tick}: ${e.message}`)] };
  }),
  runCli: (id, cmd) => {
    const s = get();
    const cfg = s.project.deviceConfigs[id];
    if (!cfg) return ['No device'];
    const st = s.cliState[id] ?? { mode: 'user' as const };
    const out = executeCliCommand(cmd, cfg as never, st);
    set((ss) => ({ cliState: { ...ss.cliState, [id]: out.state }, logs: [...ss.logs, `# ${cmd}`, ...out.output] }));
    return out.output;
  },
  saveProject: () => JSON.stringify(get().project, null, 2),
  loadProject: (text) => set({ project: JSON.parse(text) })
}));
