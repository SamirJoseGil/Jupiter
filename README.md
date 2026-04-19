# Jupiter

Jupiter es una plataforma para radicar, clasificar y gestionar PQRSDF con una vista publica para ciudadanos y un panel interno para administradores.

---

## **Link de la pagina:** https://jupiter.sglabs.site

## ![Link a la pagina](/data/qrcode_jupiter.sglabs.site.png)


## **Link de las diapositivas:** https://canva.link/3h82hx8ia91826p


## Que incluye

- Formulario ciudadano con sugerencias en tiempo real.
- Consulta de radicados y pagina de preguntas frecuentes.
- Panel de administracion con inbox, detalle, plantillas, FAQ, metricas y usuarios.
- Autenticacion con JWT.
- Analisis de solicitudes con IA o con respaldo local.
- Soporte para evidencias en imagen y documentos.

## Flujo general

1. El ciudadano envia una solicitud desde `/user`.
2. El backend la valida, la guarda y genera analisis inicial.
3. El administrador revisa la solicitud desde el panel.
4. El superadmin puede administrar usuarios.
5. El sistema guarda respuestas, correcciones, FAQ y metricas.

## Estructura simple del proyecto

### Backend

| Archivo o carpeta | Para que sirve |
|---|---|
| `backend/api/index.js` | Entrada serverless para despliegue. |
| `backend/app.js` | App Express principal, CORS, seguridad y rutas. |
| `backend/server.js` | Arranque local del backend. |
| `backend/config/database.js` | Conexion PostgreSQL. |
| `backend/config/swagger.js` | Documentacion Swagger/OpenAPI. |
| `backend/middleware/auth.js` | Verificacion de token, admin y superadmin. |
| `backend/models/pqr.js` | CRUD de solicitudes y metricas base. |
| `backend/models/response.js` | Guardado de borradores y respuestas enviadas. |
| `backend/models/responseTemplate.js` | Plantilla activa y listado de plantillas. |
| `backend/models/faq.js` | CRUD y metricas de FAQ. |
| `backend/models/user.js` | CRUD de usuarios, perfiles y metricas. |
| `backend/models/correction.js` | Registro de correcciones de clasificacion. |
| `backend/models/emailIngestion.js` | Trazabilidad de correos entrantes. |
| `backend/models/pqrRelation.js` | Relacion entre solicitudes similares. |
| `backend/routes/auth.js` | Login, perfil y gestion de usuarios. |
| `backend/routes/pqrs.js` | Ingesta, FAQ, stats, respuestas y acciones admin. |
| `backend/services/ai.js` | Analisis con Gemini, OpenAI o fallback local. |
| `backend/services/faqEngine.js` | Busqueda, ranking y respuesta de FAQ. |
| `backend/services/pqrsGuidelines.js` | Texto base institucional para respuestas. |
| `backend/services/storage.js` | Subida de evidencias a Cloudflare R2. |
| `backend/scripts/initDb.js` | Crea tablas e indices si faltan. |
| `backend/scripts/init.sql` | Esquema SQL de respaldo. |
| `backend/scripts/createAdmin.js` | Crea un usuario administrador inicial. |
| `backend/scripts/demo.sh` | Flujo de demo automatizado. |
| `backend/knowledge_base.json` | Departamentos y palabras clave para IA. |
| `backend/ENDPOINTS.md` | Referencia simple de endpoints. |

### Frontend

| Archivo o carpeta | Para que sirve |
|---|---|
| `frontend/app/root.tsx` | Layout principal de Remix. |
| `frontend/app/config.ts` | Constantes, canales y URL de API. |
| `frontend/app/entry.client.tsx` | Entrada cliente de Remix. |
| `frontend/app/entry.server.tsx` | Entrada servidor de Remix. |
| `frontend/app/env.server.ts` | Variables de entorno del lado servidor. |
| `frontend/app/routes/_index.tsx` | Pagina de inicio. |
| `frontend/app/routes/user.tsx` | Flujo ciudadano principal. |
| `frontend/app/routes/admin.tsx` | Redireccion al panel admin. |
| `frontend/app/routes/admin-dashboard.tsx` | Panel principal de admin, metricas y herramientas. |
| `frontend/app/routes/admin.$id.tsx` | Detalle de una solicitud. |
| `frontend/app/routes/admin.login.tsx` | Login interno. |
| `frontend/app/routes/admin.account.tsx` | Perfil de cuenta administrativa. |
| `frontend/app/routes/preguntas-frecuentes.tsx` | Pagina publica de FAQ. |
| `frontend/app/routes/consultar-radicado.tsx` | Consulta publica de estado. |
| `frontend/app/routes/canales.flor-ia.tsx` | Fallback de Flor IA por WhatsApp. |
| `frontend/app/components/pqrsd-form.tsx` | Formulario ciudadano. |
| `frontend/app/components/pqrs-status-check.tsx` | Consulta de estado por radicado. |
| `frontend/app/components/faq-assistant.tsx` | Buscador y asistente de FAQ. |
| `frontend/app/components/faq-section.tsx` | FAQ publica en la home. |
| `frontend/app/components/admin-layout.tsx` | Shell del area administrativa. |
| `frontend/app/components/admin-response-template.tsx` | Editor de plantilla institucional. |
| `frontend/app/components/admin-faq-manager.tsx` | CRUD de FAQ. |
| `frontend/app/components/admin-user-manager.tsx` | CRUD de usuarios para superadmin. |
| `frontend/app/components/admin-pqr-relations.tsx` | Relaciones entre solicitudes. |
| `frontend/app/components/detail-view.tsx` | Vista detalle y acciones admin. |
| `frontend/app/components/inbox.tsx` | Lista principal de solicitudes. |
| `frontend/app/components/channel-view.tsx` | Vista alternativa por canal. |
| `frontend/app/components/email-importer.tsx` | Importacion de correos. |
| `frontend/app/components/response-draft.tsx` | Borrador de respuesta. |
| `frontend/app/components/navbar.tsx` | Navegacion publica. |
| `frontend/app/components/footer.tsx` | Pie de pagina publico. |
| `frontend/app/components/hero-section.tsx` | Hero principal de la home. |
| `frontend/app/components/entities-section.tsx` | Seccion de entidades o areas. |
| `frontend/app/components/how-works-section.tsx` | Explicacion del flujo. |
| `frontend/app/components/what-is-pqrs.tsx` | Definicion del servicio. |
| `frontend/app/components/accessibility-controls.tsx` | Controles de accesibilidad. |
| `frontend/app/components/toast-notification.tsx` | Notificaciones breves. |
| `frontend/app/components/client-only.tsx` | Render solo en cliente. |
| `frontend/app/components/icons.tsx` | Iconos del proyecto. |
| `frontend/app/utils/auth.ts` | Tokens, usuario guardado y headers. |
| `frontend/app/tailwind.css` | Estilos globales. |

## Endpoints principales

### Auth

```text
POST /api/auth/register
POST /api/auth/login
GET  /api/auth/me
PUT  /api/auth/me/profile
GET  /api/auth/users
POST /api/auth/users
PUT  /api/auth/users/:id
DELETE /api/auth/users/:id
```

### Solicitudes y panel

```text
POST /api/ingest
GET  /api/PQRSDf
GET  /api/PQRSDf/:id
POST /api/analyze/:id
POST /api/PQRSDf/:id/accept
PUT  /api/PQRSDf/:id/classification
PUT  /api/PQRSDf/:id/assign
PUT  /api/PQRSDf/:id/status
GET  /api/stats
```

### FAQ y respuestas

```text
GET  /api/faq
GET  /api/faq/search
POST /api/faq/ask
POST /api/faq
PUT  /api/faq/:id
DELETE /api/faq/:id
POST /api/responses/:pqrId
GET  /api/responses/:pqrId
GET  /api/responses/templates
PUT  /api/responses/templates
```

## Requisitos

- Node.js 20 o superior.
- PostgreSQL.
- npm.

## Variables de entorno

### Backend

Usa `backend/.env.example` como base. Las variables importantes son:

| Variable | Uso |
|---|---|
| `DATABASE_URL` | Conexion principal a PostgreSQL. |
| `DIRECT_URL` | Conexion directa a la base. |
| `PORT` | Puerto del backend. |
| `FRONTEND_URL` | Origen permitido del frontend. |
| `JWT_SECRET` | Firma de tokens. |
| `OPENAI_API_KEY` | Analisis con OpenAI. |
| `GEMINI_API_KEY` | Analisis con Gemini. |
| `N8N_WEBHOOK_SECRET` | Webhook de correo. |
| `CLOUDFLARE_ACCOUNT_ID` | Cuenta de Cloudflare R2. |
| `CLOUDFLARE_R2_BUCKET` | Bucket de evidencias. |
| `CLOUDFLARE_R2_ACCESS_KEY_ID` | Acceso a R2. |
| `CLOUDFLARE_R2_SECRET_ACCESS_KEY` | Secreto de R2. |
| `CLOUDFLARE_R2_PUBLIC_URL` | URL publica opcional para evidencias. |

### Frontend

| Variable | Uso |
|---|---|
| `VITE_API_BASE_URL` | URL del backend. Si no existe, usa `http://localhost:8000` en local. |
| `VITE_MEDELLIN_WEB_URL` | Redireccion del canal web oficial. |
| `VITE_MEDELLIN_AI_URL` | Redireccion de Flor IA. |
| `VITE_MEDELLIN_EMAIL_URL` | Redireccion del correo oficial. |
| `VITE_MEDELLIN_PHONE_URL` | Redireccion telefonica oficial. |
| `VITE_FLOR_IA_WHATSAPP_URL` | Enlace de WhatsApp para Flor IA. |

## Inicio rapido

### Backend

```bash
cd backend
npm install
cp .env.example .env
npm start
```

El backend crea o actualiza tablas al iniciar. La API queda en `http://localhost:8000` y Swagger en `http://localhost:8000/api/docs`.

### Crear un admin inicial

```bash
cd backend
npm run create-admin
```

Tambien puedes pasar correo, clave y dependencia por variables de entorno o argumentos.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

La aplicacion queda en `http://localhost:5173`.

## Uso rapido

### Ciudadano

1. Abre `/user`.
2. Escribe la solicitud.
3. Adjunta evidencias si aplica.
4. Enviala y guarda el radicado.

### Administrador

1. Abre `/admin/login`.
2. Entra al panel.
3. Revisa inbox, detalle, respuestas, FAQ, metricas y relaciones.
4. Si el usuario tiene rol `superadmin`, tambien puede gestionar usuarios.

## Notas

- El formulario valida longitud minima y maxima, bloquea lenguaje no permitido y limita formatos de archivo.
- El backend limita a 3 radicados por hora por usuario o IP para reducir spam.
- La documentacion tecnica adicional esta en `backend/ENDPOINTS.md`.
- El inventario interno de funciones por archivo esta en `INTERNAL_FUNCTIONS.md`.
- 📚 API Docs: http://localhost:8000/api/docs

¡**Let's go! 🚀**

```
backend/              # Express API + PostgreSQL

frontend/             # Remix application

data/

challenges/ 
```