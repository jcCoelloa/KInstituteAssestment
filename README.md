# K Institute Assessment

Este repositorio contiene un prototipo funcional de un asistente por WhatsApp para K Institute, junto con un dashboard para gestionar casos de atención. El objetivo es que cualquier desarrollador pueda clonar el proyecto, instalarlo y correrlo localmente tanto en macOS como en Windows.

## Stack principal
- Backend: NestJS + TypeScript
- Frontend: Next.js + TypeScript
- Base de datos: Prisma + SQLite
- Pruebas: Jest y Playwright
- Integración: webhook para WhatsApp / Twilio

## Requisitos previos
Instala lo siguiente antes de correr el proyecto:
- Node.js 18 o superior
- npm 9 o superior
- Git
- (Opcional) ngrok para exponer el webhook a Twilio

### macOS
Puedes instalar Node.js con Homebrew:

```bash
brew install node
```

### Windows
Descarga e instala Node.js desde:
https://nodejs.org/

Verifica la instalación:

```bash
node --version
npm --version
```

## 1. Clonar el repositorio

```bash
git clone <url-del-repo>
cd KInstituteAssestment
```

## 2. Instalar dependencias
Desde la raíz del proyecto:

```bash
npm install
```

Esto instalará las dependencias del monorepo para backend y frontend.

## 3. Configurar variables de entorno
En la carpeta backend crea un archivo .env basado en .env.example si existe o define las variables necesarias:

```bash
cd backend
cp .env.example .env
```

Si no existe .env.example, crea un archivo .env con al menos:

```env
DATABASE_URL="file:./dev.db"
```

## 4. Preparar la base de datos
Desde la carpeta backend:

```bash
npx prisma migrate dev --name init
```

Esto generará la base SQLite y las tablas necesarias.

Si necesitas regenerar el cliente de Prisma:

```bash
npx prisma generate
```

## 5. Ejecutar el backend
Desde la carpeta backend:

```bash
npm run dev
```

El backend quedará disponible en:
- http://localhost:3001

## 6. Ejecutar el frontend
Abre una nueva terminal y ejecuta:

```bash
cd frontend
npm run dev
```

El dashboard quedará disponible en:
- http://localhost:3000/dashboard

## 7. Probar el webhook localmente
Puedes probar el endpoint de WhatsApp con una petición HTTP local:

```bash
curl -X POST http://localhost:3001/webhook/whatsapp \
  -H "Content-Type: application/x-www-form-urlencoded" \
  --data "Body=quiero%20un%20reclamo&From=whatsapp%3A%2B51999999999"
```

La respuesta debería ser un XML de TwiML con el mensaje generado por el bot.

## 8. Conectar el webhook a Twilio WhatsApp Sandbox
Para que Twilio pueda entregar mensajes reales a tu proyecto, necesitas exponer el backend a internet.

### Opción recomendada: ngrok
Instálalo y levanta un túnel hacia el puerto 3001:

### macOS
```bash
brew install ngrok
ngrok http 3001
```

### Windows
Descarga ngrok desde https://ngrok.com/ y ejecuta:

```powershell
ngrok http 3001
```

Luego copia la URL pública que te genera ngrok y configúrala en Twilio en el campo del WhatsApp Sandbox:

```text
https://<tu-url-ngrok>/webhook/whatsapp
```

## 9. Ejecutar pruebas
### Backend
```bash
cd backend
npm test -- --runInBand
```

### Frontend
```bash
cd frontend
npm run test:e2e
```

## Estructura del proyecto
- backend/: lógica de negocio, webhook, Prisma y servicios
- frontend/: dashboard y vista de casos
- document/: documento técnico de la prueba

## Notas técnicas
- El bot usa reglas simples por palabras clave para detectar intenciones.
- El flujo de casos está basado en un caso por número de teléfono y un historial de mensajes.
- El dashboard consume la API del backend y permite filtrar por tipo y estado.

## Troubleshooting común
- Si el puerto 3000 o 3001 está ocupado, libera el proceso o cambia el puerto.
- Si Prisma falla, vuelve a ejecutar:

```bash
npx prisma migrate dev --name init
```

- Si Twilio no responde, revisa que la URL pública de ngrok sea la correcta y que apunte a `/webhook/whatsapp`.
