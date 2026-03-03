# Modelos de dispositivos

## Router genérico (Fase 1)
- Interfaces: `e0/0`, `e0/1`.
- Config: IPv4/máscara por interfaz, estado admin up/down.
- Rutas estáticas.
- CLI básica de configuración/consulta.

## PC genérica (Fase 1)
- Interfaz: `NIC0`.
- IP/máscara y gateway por defecto.
- Puede originar ping desde herramienta UI.

## Nota de extensibilidad
El diseño de paquetes separa:
- Tipos (`common`)
- Defaults por dispositivo (`device-models`)
- Lógica de simulación y parser (`sim-engine`)
permitiendo añadir Switch/Server/AP sin romper contratos.
