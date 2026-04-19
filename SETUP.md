# Setup

Guia corta para levantar Jupiter en local.

## Requisitos

- Node.js 20 o superior
- PostgreSQL
- npm

## 1. Backend

```bash
cd backend
npm install
cp .env.example .env
```

Completa `backend/.env` con al menos:

- `DATABASE_URL`
- `DIRECT_URL`
- `JWT_SECRET`
- `FRONTEND_URL`
- `PORT`

Opcionales:

- `OPENAI_API_KEY` o `GEMINI_API_KEY`
- `N8N_WEBHOOK_SECRET`
- credenciales de Cloudflare R2

Luego inicia el backend:

```bash
npm start
```

Verificaciones:

```bash
curl http://localhost:8000/health
```

Swagger:

```text
http://localhost:8000/api/docs
```

## 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

El frontend usa `http://localhost:8000` como API por defecto si no defines `VITE_API_BASE_URL`.

URL local:

```text
http://localhost:5173
```

## 3. Crear un admin inicial

```bash
cd backend
npm run create-admin
```

Tambien puedes pasar correo, clave y dependencia por argumentos:

```bash
npm run create-admin -- admin@jupiter.test Admin123456 Infraestructura
```

## 4. Primera prueba

1. Abre `/user`.
2. Envía una solicitud con texto valido y sin groserias.
3. Abre `/admin/login`.
4. Entra al panel y revisa la solicitud.
5. Prueba el flujo de FAQ, plantillas, metricas y usuarios si tu cuenta es `superadmin`.

## 5. Base de datos

El backend intenta crear o actualizar las tablas al iniciar.
Si quieres aplicar el SQL manualmente:

```bash
psql "$DATABASE_URL" -f backend/scripts/init.sql
```

## 6. Problemas comunes

### No conecta a PostgreSQL

- Revisa `DATABASE_URL`.
- Verifica que PostgreSQL esté activo.
- Confirma que la base exista y acepte conexiones.

### El frontend no llama al backend

- Revisa `VITE_API_BASE_URL`.
- Si no lo defines en local, debe usar `http://localhost:8000`.

### Login ok pero no ves usuarios

- Solo aparece el modulo de usuarios si el rol es `superadmin`.
- El rol se puede revisar en la tabla `users`.

### El formulario no deja enviar

- El texto debe tener entre 20 y 5000 caracteres.
- No puede contener palabras bloqueadas.
- Solo se admiten formatos permitidos para imagen y documento.

## 7. Archivos que conviene revisar primero

- `backend/server.js`
- `backend/app.js`
- `backend/routes/pqrs.js`
- `backend/routes/auth.js`
- `backend/scripts/initDb.js`
- `frontend/app/routes/_index.tsx`
- `frontend/app/routes/user.tsx`
- `frontend/app/routes/admin-dashboard.tsx`
- `frontend/app/components/pqrsd-form.tsx`
- `frontend/app/components/admin-user-manager.tsx`

## 8. Inventario interno de funciones

Para revisar funciones por archivo de forma rapida usa:

- `INTERNAL_FUNCTIONS.md`

Este archivo se genero con un barrido de `backend` y `frontend/app` excluyendo `node_modules`.
