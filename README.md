# NetLab Studio

NetLab Studio es una app de escritorio multiplataforma para diseño y simulación educativa de redes. Este repo implementa **Fase 1 completa (MVP)** con base extensible para Fase 2/3.

## Stack elegido

**Opción A: Electron + React + TypeScript**.

Justificación:
- UI rica y rápida con React.
- Distribución multiplataforma madura con Electron.
- Monorepo TypeScript reutilizando tipos entre UI, modelos y motor.

## Plan de trabajo aplicado

1. Esqueleto monorepo con workspaces.
2. Motor de simulación L3 mínimo (eventos + forwarding + ping).
3. Parser CLI por árbol de comandos.
4. UI desktop: lienzo, drag & drop, enlaces, inspector, terminal, ping.
5. Persistencia de proyecto `.netlab` (JSON).
6. Tests unitarios y docs.

## Arquitectura

```text
/apps/desktop (Electron + React)
   │ acciones UI (drag, link, CLI, ping, save/open)
   ▼
estado global (Zustand)
   │ invoca
   ├── /packages/device-models (defaults y puertos)
   ├── /packages/common (tipos + esquema .netlab)
   └── /packages/sim-engine (CLI parser + simulación)
```

Flujo de eventos:
1. Usuario interactúa en UI.
2. Store actualiza estado de topología/config.
3. CLI o ping llaman a sim-engine.
4. Sim-engine devuelve eventos (logs + resultado).
5. UI renderiza estado/logs.

## Estructura

- `apps/desktop`: app Electron/React.
- `packages/common`: tipos compartidos y formato de proyecto.
- `packages/device-models`: modelos base Router/PC.
- `packages/sim-engine`: parser CLI + simulación L3 de Fase 1.
- `docs/COMMANDS.md`: comandos CLI soportados.
- `docs/DEVICE_MODELS.md`: modelos y capacidades.

## Fase 1 (implementada)

- Canvas con grid, drag & drop desde biblioteca.
- Colocación de Router/PC.
- Enlaces entre nodos (Shift+click en origen/destino).
- Inspector lateral + terminal básica por dispositivo.
- Ping simulado (ICMP) con forwarding IPv4 por rutas conectadas/estáticas.
- Guardar/abrir proyecto JSON (`.netlab`).

## Esquema `.netlab` (JSON)

```json
{
  "version": 1,
  "devices": [],
  "links": [],
  "deviceConfigs": {},
  "canvasState": { "zoom": 1, "panX": 0, "panY": 0, "gridEnabled": true }
}
```

## Instalación y arranque (un comando)

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Test

```bash
npm run test
```

## Roadmap de fases

- **Fase 2**: switch L2, VLAN/trunk, ARP/MAC learning, GUI de conmutación.
- **Fase 3**: DHCP, OSPF básico, NAT/PAT, ACL simples, simulación paso-a-paso visual.
