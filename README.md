# LOB Wallet

Aplicación de billetera digital para consultar saldo, mostrar una tarjeta digital, sincronizar movimientos, encontrar tiendas y consultar promociones. Está construida con Laravel, Inertia, React, TypeScript y NativePHP Mobile.

## Funcionalidades

- Autenticación y verificación de correo con Laravel Fortify.
- Wallet con saldo, tarjeta digital y código de barras.
- Sincronización manual y automática de la información de la wallet.
- Historial de movimientos recientes.
- Mapa de tiendas con ubicación del usuario, búsqueda y detalle de tienda.
- Panel inferior optimizado para tiendas en móvil.
- Pantalla de promociones con descuentos, vigencia y tienda relacionada.
- Mensajes globales con Sonner para estados de éxito y error.
- Pantalla global para errores HTTP `403`, `404`, `419`, `429`, `500` y `503`.
- Soporte para NativePHP Mobile y geolocalización.

## Requisitos

- PHP 8.3 o superior.
- Composer.
- Node.js y npm o pnpm.
- SQLite, MySQL o el motor configurado en `.env`.
- Una API externa de LOB configurada mediante `API_URL`.

Para compilar y ejecutar NativePHP también se requieren las herramientas nativas correspondientes a la plataforma, como Android Studio o Xcode.

## Instalación

```bash
git clone <url-del-repositorio>
cd LobWallet
composer install
cp .env.example .env
php artisan key:generate
```

Configura la conexión de base de datos y la URL de la API en `.env`:

```env
APP_NAME="LOB Wallet"
APP_URL=http://localhost:8000
API_URL=https://api.example.com
```

Después ejecuta las migraciones y prepara el frontend:

```bash
php artisan migrate
npm install
npm run build
```

El script `composer setup` automatiza la instalación inicial, generación de la clave, migraciones, instalación de paquetes frontend y build.

## Desarrollo local

Para iniciar Laravel, Vite y los procesos de desarrollo configurados:

```bash
composer run dev
```

También puedes ejecutar los procesos por separado:

```bash
php artisan serve
npm run dev
```

La aplicación web estará disponible normalmente en `http://localhost:8000`.

## API externa

La aplicación utiliza `ApiService` para comunicarse con la API remota. La URL base se obtiene de `API_URL`.

Servicios principales:

- `AuthService`: login, usuario actual y token remoto.
- `WalletService`: información del dashboard.
- `SyncService`: sincronización de cuentas, tarjetas y movimientos.
- `StoreService`: endpoint `stores`.
- `PromotionService`: endpoint `promotions`.

Las rutas web protegidas requieren autenticación y verificación de correo:

| Método | Ruta | Función |
| --- | --- | --- |
| GET | `/dashboard` | Wallet y movimientos |
| GET | `/newCard` | Formulario para agregar tarjeta |
| POST | `/card` | Agregar tarjeta |
| GET | `/store` | Mapa de tiendas |
| GET | `/promotions` | Promociones disponibles |
| POST | `/sync` | Sincronizar wallet |

La pantalla de promociones acepta una respuesta con cualquiera de estas formas:

```json
{ "promotions": [] }
```

```json
{ "data": [] }
```

También puede recibir directamente una lista de promociones.

Cada promoción puede incluir `id`, `title`, `description`, `image_url`, `discount`, `category`, `store_code`, `store_name`, `valid_until`, `cta_label` y `cta_url`.

## NativePHP Mobile

El proyecto ya incluye NativePHP Mobile y el plugin de geolocalización configurado en `NativeServiceProvider`.

Para consultar los comandos disponibles:

```bash
./native list
```

Para ejecutar la aplicación con NativePHP Jump durante el desarrollo:

```bash
./native jump
```

Para compilar o ejecutar la aplicación nativa, usa los comandos de NativePHP disponibles en el entorno:

```bash
./native run
```

La geolocalización requiere permisos nativos. Deben solicitarse solamente cuando el usuario abra el mapa y se debe ofrecer una alternativa si los rechaza.

El escaneo de códigos de barras todavía requiere integrar un plugin nativo de scanner y conectar su resultado con el formulario de tarjeta.

## Comandos de calidad

```bash
npm run types:check
npm run lint:check
npm run format:check
composer run lint:check
php artisan test
```

El flujo completo configurado en Composer es:

```bash
composer run test
```

Este flujo ejecuta limpieza de configuración, Pint, PHPStan y las pruebas de Laravel.

## Estructura principal

```text
app/
  Http/Controllers/       Controladores web e Inertia
  Models/                 Modelos locales
  Services/               Integraciones con la API externa
database/
  migrations/             Estructura de la base de datos local
resources/js/
  components/             Componentes React reutilizables
  hooks/                  Hooks de responsive, sesión y apariencia
  pages/                  Pantallas Inertia
  services/               Servicios frontend
  types/                  Tipos TypeScript
routes/
  web.php                 Rutas web protegidas
config/
  nativephp.php           Configuración de NativePHP Mobile
```

## Notas de despliegue

Antes de desplegar:

```bash
php artisan config:cache
php artisan route:cache
php artisan view:cache
npm run build
```

En producción, usa `APP_DEBUG=false`, una `API_URL` HTTPS y credenciales separadas por entorno. No almacenes tokens ni claves privadas en el repositorio.
