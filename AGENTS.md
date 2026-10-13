# LobWallet ----------

## Stack

- Laravel 13 / php 8.4
- React + Inertia
- NativePHP Mobile
- SQLite local
- API Laravel remota

## Arquitectura

- La aplicacion es local-first.
- SQLite solo guarda datos del usuario autenticado.
- La API remota es la fuente de sincronizacion.
- No ejecutar sincronizacion bloqueante durante el render inicial.
- Mantener separacion entre AuthService, SyncService y WalletService.

## Backend

- Preferir Query Builder cuando ya se use el module.
- Usar transacciones para operaciones relacionadas.
- Seleccionar solo las columnas necesarias.
- Evitar queries innecesarias en Dashboard.

## Frontend

- No bloquear el primer render por una llamada de red.
- Acutalizar saldo e historial despues de una sincronizacion.
- Mantener compatibilidad movil.

## Testing

- Todo cambio en sincronizacion debe probar:
    - usuario autenticado
    - datos aislados por usuario
    - sync incremental
    - comportamiento sin conexion
