# CLI soportada (MVP / Fase 1)

## Modos
- `enable`
- `configure terminal`
- `interface <nombre>`
- `exit`
- `end`

## Configuración L3
- `ip address <ip> <mask>` (en modo interfaz de router)
- `shutdown`
- `no shutdown`
- `ip route <network> <mask> <next-hop>`

## Operación
- `show ip route`
- `show interfaces`
- `ping <ip>` (placeholder para integración con herramienta de ping)

## Errores
- Comando desconocido devuelve `% Unknown command`.
