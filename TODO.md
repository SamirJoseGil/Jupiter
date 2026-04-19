# 🎯 TODO MVP - OmegaHack 2026 PQRSD System

## � CONTEXTO DEL RETO

**3 Factores que afectan las PQRs:**
1. ✅ **Mala clasificación** → Envían a dependencia incorrecta (SOLUÇÃO: Pre-clasificación IA) 
2. ✅ **Textos largos/desordenados** → Cuesta identificar qué quiere el ciudadano (SOLUÇÃO: Resumen IA)
3. ✅ **Volumen alto** → Reciben muchas solicitudes por email, desorganizadas (SOLUÇÃO: Centralización + Orden por dependencia)

**Casos de uso reales:**
- 👤 **Ciudadano**: Envía PQRS por formulario web (sin login)
- 🧑‍💼 **Funcionario de Email**: Recibe 100+ correos/día → Los copia al sistema para procesarlos
- 👨‍💻 **Admin de Dependencia**: Ve sus PQRs organizadas, da pre-respuesta (draft), luego envía

---

## 📍 FASE 0: INFRAESTRUCTURA CRÍTICA (DEBE EXISTIR PARA QUE FUNCIONE TODO)

## 📍 FASE 0: INFRAESTRUCTURA CRÍTICA (DEBE EXISTIR PARA QUE FUNCIONE TODO)

### ✅ F0.1 - Autenticación Admin (Acceso Rápido) COMPLETADO
**Descripción:** Solo admins ven panel. Ciudadano nunca necesita login.
**Requisito Real:** "Un administrador pueda iniciar sesión y ver las solicitudes"

- [x] Tabla `users` en PostgreSQL
  ```sql
  CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    department VARCHAR(100),
    role VARCHAR(50) DEFAULT 'admin',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
  );
  ```

- [x] Backend: POST `/api/auth/login`
  ```json
  {
    "email": "admin@alcaldia.gov.co",
    "password": "password123"
  }
  ```
  Retorna: `{ token: "jwt_token", user: { id, email, department } }`

- [x] Backend: GET `/api/auth/me` (verificar sesión)

- [x] Frontend: Login page `/admin/login`
  - Email input
  - Password input  
  - "Ingresar" button
  - Link a home si no es admin

- [x] Frontend: Protected routes (redirect to login si no autenticado)
  - `/admin` → protegida
  - `/admin/:id` → protegida
  - `/user` → pública

- [x] Middleware: Verificar token en cada request

**Estimado:** 1.5 horas
**Archivo:** `backend/models/user.js`, nuevos endpoints auth, JWT middleware

---

### ✅ F0.2 - Organización por Dependencia COMPLETADO
**Descripción:** Cada PQR está asignada a una dependencia. Se muestra filtrada.
**Requisito Real:** "Mostrar solicitudes separadas según una de todas las dependencias"

- [x] Agregar columna `assigned_department` a tabla `pqrs`
  ```sql
  ALTER TABLE pqrs ADD COLUMN assigned_department VARCHAR(100);
  ALTER TABLE pqrs ADD COLUMN assigned_to_user_id INTEGER REFERENCES users(id);
  ```

- [x] Cuando se analiza con IA, se setea `assigned_department` automáticamente

- [x] Backend: GET `/api/pqrs?department=Infraestructura`
  - Filtrar por department (si es admin de esa dependencia)
  - Si es admin general, ver todas

- [x] Frontend: Admin page muestra filtro de departamentos
  - Dropdown: "Todas las dependencias" / "Infraestructura" / "Movilidad" / etc.
  - Solo muestra PQRs de esa dependencia
  - Admin solo ve sus dependencias asignadas

**Estimado:** 45 min
**Archivo:** Backend routes filter, Frontend department selector

---

### ✅ F0.3 - Draft Responses System COMPLETADO
**Descripción:** Admin escribe pre-respuesta SIN enviarla. Luego ciudadano la ve y acepta o rechaza.
**Requisito Real:** "Puede dar una pre-respuesta a estas solicitudes, sin enviarla... deben ser verificadas por los usuarios finales"

- [x] Tabla `responses` en PostgreSQL
  ```sql
  CREATE TABLE responses (
    id SERIAL PRIMARY KEY,
    pqr_id INTEGER REFERENCES pqrs(id),
    created_by_user_id INTEGER REFERENCES users(id),
    response_text TEXT,
    status VARCHAR(50) DEFAULT 'draft',  -- draft, sent, accepted_by_user, rejected_by_user
    sent_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
  );
  ```

- [x] Frontend: En detail view, agregar textarea para escribir respuesta
  - Mostrar: "Pre-respuesta (No enviada)"
  - Botón: "Guardar como borrador" → POST `/api/responses/{id}`
  - Botón: "Enviar ahora" → Si, mostrar modal de confirmación

- [x] Backend: POST `/api/responses/{pqr_id}`
  ```json
  {
    "response_text": "Estimado ciudadano, su solicitud ha sido recibida...",
    "send": false  // si true, envía automáticamente
  }
  ```

- [x] Ciudadano recibe email/notificación con pre-respuesta
  - Link: "Aceptar respuesta" / "Rechazar y solicitar cambios"
  - Si acepta → status = "resolved"
  - Si rechaza → notifica admin

**Estimado:** 1.5 horas
**Archivo:** `backend/models/response.js`, `frontend/app/components/response-draft.tsx`

---

**TOTAL FASE 0: ~3.5 horas** ⏰

---

## 📍 FASE 1: ADMIN ACTIONS (LA EXPERIENCIA RÁPIDA) COMPLETADO
**Descripción:** El admin debe poder actuar sobre las solicitudes
**Requisito IAContext:** "aceptar clasificación, modificar, cambiar estado"

- [x] Modal de confirmación para "Aceptar Clasificación"
  - Backend: POST `/api/pqrs/{id}/accept` ✅
  - Setear status a "assigned" automáticamente ✅
  
- [x] Modal para "Modificar Clasificación"
  - Dropdown con 10 departamentos del knowledge base ✅
  - Campo de confianza editable ✅
  - Backend: PUT `/api/pqrs/{id}/classification` ✅
  
- [x] Modal para "Asignar a Dependencia"
  - Mismo dropdown de departamentos ✅
  - Campo de responsable (opcional) ✅
  - Backend: PUT `/api/pqrs/{id}/assign` ✅

**Estimado:** 1-1.5 horas
**Archivo:** `frontend/app/components/detail-view.tsx` + rutas backend
**Estado:** ✅ IMPLEMENTADO EN SESIÓN ANTERIOR

---

### ✅ F1.2 - Learning System (Feature Ganadora del Pitch) COMPLETADO
**Descripción:** "El sistema aprende del comportamiento humano"
**Requisito IAContext:** "Cuando el admin corrige algo: guardas el cambio"

- [x] Tabla `corrections` en PostgreSQL
  ```sql
  CREATE TABLE corrections (
    id SERIAL PRIMARY KEY,
    pqr_id INTEGER REFERENCES pqrs(id),
    original_classification VARCHAR(100),
    corrected_classification VARCHAR(100),
    confidence_before INTEGER,
    confidence_after INTEGER,
    admin_notes TEXT,
    created_at TIMESTAMP DEFAULT NOW()
  );
  ```

- [x] Backend endpoint: POST `/api/corrections/{id}`
  - Guardar cambios realizados
  - Retornar resumen

- [x] Frontend: Display de "Cambios registrados para mejorar IA"
  - Mensaje visual en detail view después de cambios

**Estimado:** 45 min
**Archivo:** `backend/models/corrections.js` + nuevos endpoints

---

### ✅ F1.3 - Feedback Loop & Metrics COMPLETADO
**Descripción:** Dashboard mínimo de impacto
**Requisito IAContext:** "reduce carga operativa"

- [x] Endpoint GET `/api/stats`
  ```json
  {
    "total_pqrs": 10,
    "avg_classification_confidence": 87.5,
    "total_corrected": 2,
    "time_saved_minutes": 125,  // (total * 15 min/clasificación)
    "pending": 2,
    "analyzed": 5,
    "assigned": 2,
    "resolved": 1
  }
  ```

- [x] Mostrar stats en admin page (ya está el UI)
- [x] Mejora: stats card con "Tiempo ahorrado: 125 min" en lugar de solo números

**Estimado:** 30 min
**Archivo:** `backend/routes/pqrs.js` + `frontend/app/routes/admin.tsx`

---

**TOTAL FASE 1: ~2.5 horas** ⏰

---

## 📍 FASE 2: VALIDACIONES & UX (2-3 horas)

### ✅ F2.1 - Frontend Validations COMPLETADO
**Descripción:** Mejorar experience del usuario
**Requisito IAContext:** "simple, sin validaciones complejas, pero user-friendly"

- [x] Textarea: Min 20 caracteres, max 2000
- [x] Validar que el canal esté seleccionado
- [x] Mostrar contador de caracteres
- [x] Desabilitar botón si < 20 chars
- [x] Toast notifications (no alerts)

**Estimado:** 45 min
**Archivo:** `frontend/app/components/pqrsd-form.tsx`

---

### ✅ F2.2 - Real-time Suggestions COMPLETADO
**Descripción:** Detectar mientras escribe (Visual Magic)
**Requisito IAContext:** "sugerencia automática mientras escribe - Esto vende muy bien"

- [x] Debounce input (500ms) en textarea
- [x] Llamar POST `/api/analyze-preview` (sin guardar)
- [x] Mostrar en un box: "Detectamos que estás solicitando: [Departamento] - Confianza: 85%"
- [x] Backend: Endpoint new POST `/api/analyze-preview` que NO guarda en BD

**Estimado:** 1 hora
**Archivo:** `frontend/app/components/pqrsd-form.tsx` + backend endpoint

---

### ✅ F2.3 - Error Handling & Recovery COMPLETADO
**Descripción:** Manejo robusto de errores
- [x] Try-catch en todos los fetch
- [x] Mensajes de error claros en español
- [x] Retry button en caso de fallo
- [x] Timeout handling (5s para análisis, 10s para fetch)

**Estimado:** 30 min

---

**TOTAL FASE 2: ~2 horas** ⏰

---

## 📍 FASE 3: EMAIL INGESTION WORKFLOW (BONUS - Conecta Factor #3)
**Descripción:** Funcionario de email puede copiar solicitudes del correo al sistema
**Requisito Real:** "Ellos reciben demasiadas solicitudes por email"

### ✅ F3.1 - Email Inbox Integration COMPLETADO
**Descripción:** Diferenciar visualmente por canal
**Requisito IAContext:** "Simula: Email → input tipo correo, Chat → UI tipo WhatsApp"

- [x] En `/admin`, agregar tab: "Importar desde Email" ✅
- [x] Textarea grande para pegar correo completo ✅
- [x] Parser automático extrae: ✅
  - De (email del ciudadano) ✅
  - Asunto (clasificación automática) ✅
  - Cuerpo (contenido) ✅
- [x] Botón: "Importar como PQRS" ✅
- [x] Se guarda como si fuera "email" channel ✅
- [x] IA clasifica automáticamente ✅

**Estimado:** 1 hora
**Estado:** ✅ IMPLEMENTADO - Frontend component + Backend endpoint + Admin integration
**Archivo:** frontend/app/components/email-importer.tsx + backend/routes/pqrs.js

---

### ✅ F3.2 - Multi-Channel Specific UI COMPLETADO
- [x] Email channel: Mostrar formato similar a Gmail ✅
- [x] Chat channel: Estilo WhatsApp ✅
- [x] Web: Formulario (actual) ✅
- [x] Toggle de vista en admin panel ✅
- [x] Contador de items por canal ✅

**Estimado:** 1.5 horas
**Estado:** ✅ IMPLEMENTADO - ChannelView component con 3 estilos diferentes
**Archivo:** frontend/app/components/channel-view.tsx + admin.tsx integration

---

---

## 📍 FASE 4: DOCUMENTACIÓN & DEMOSTRACIÓN (1-2 horas)

### ✅ F4.1 - Documentación API COMPLETADO
**Descripción:** Spec de API para el pitch
- [x] OpenAPI/Swagger spec (accesible en http://localhost:8000/api/docs) ✅
- [x] Postman collection (backend/ENDPOINTS.md) ✅
- [x] cURL examples (en README.md) ✅

**Estimado:** 45 min
**Estado:** ✅ SWAGGER GENERADO AUTOMÁTICAMENTE

---

### ✅ F4.2 - Demo Script COMPLETADO
**Descripción:** Automatizar la demostración
- [x] Script bash: crea 3 PQRSD de prueba
- [x] Script: una se analiza, una se corrige, una se resuelve
- [x] Captura de pantalla final

**Estimado:** 30 min

---

### ✅ F4.3 - Pitch Deck Notes COMPLETADO
**Descripción:** Bullets para la presentación
- [x] Problema: "Alcaldía saturada, clasificación manual, lenta" ✅
- [x] Solución: "Centralización + IA + Validación Humana" ✅
- [x] Impacto: "70% menos tiempo en clasificación" ✅
- [x] Diferenciador: "Sistema aprende del humano" ✅

**Estimado:** 30 min
**Estado:** ✅ DOCUMENTADO EN ARCHIVOS

---

---

## 📍 FASE 5: OPTIMIZACIONES (Si te alcanza - 1-2 horas)

### 🟢 F5.1 - Performance
- ⏳ Lazy load en inbox (virtualization si >100 items) - OPCIONAL
- ⏳ Compress API responses - OPCIONAL
- ⏳ Cache en frontend (localStorage) - OPCIONAL

### 🟢 F5.2 - Accessibility
- ⏳ ARIA labels - OPCIONAL
- ⏳ Keyboard navigation - OPCIONAL
- ⏳ Color contrast (already good with Tailwind) - OPCIONAL

### 🟢 F5.3 - Mobile Responsive
- ⏳ Test en mobile (Already should be good) - OPCIONAL
- ⏳ Ajustar split-screen detail para móvil (stack vertical) - OPCIONAL

---

---

## 🎯 RESUMEN DE PRIORIDADES (REORDENADO POR IMPACTO)

| Fase | Requisito Real | Horas | Criticidad | Status |
|------|---------------|-------|-----------|--------|
| 0. Autenticación | Admin login + Protected routes | 1.5 | 🔴 MUST | ✅ DONE |
| 0. Org. Dependencias | Filtrar/separar por dependencia | 0.75 | 🔴 MUST | ✅ DONE |
| 0. Draft Responses | Pre-respuesta sin enviar | 1.5 | 🔴 MUST | ✅ DONE |
| 1. Admin Actions | Aceptar/Modificar/Asignar | 1.5 | 🔴 MUST | ✅ DONE |
| 1. Learning System | Sistema aprende de cambios | 0.75 | 🔴 MUST | ✅ DONE |
| 1. Metrics | Stats de impacto | 0.5 | 🔴 MUST | ✅ DONE |
| 2. Validations | Campos validados | 0.75 | 🟠 SHOULD | ✅ DONE |
| 2. Real-time Suggestions | Detectar mientras escribe | 1 | 🟠 SHOULD | ✅ DONE |
| 2. Error Handling | Manejo de errores | 0.5 | 🟠 SHOULD | ✅ DONE |
| 3. Email Import | Copiar correos al sistema | 1.5 | 🟡 BONUS | ✅ DONE |
| 3. Channel UI | Email/Chat/Web específicos | 1.5 | 🟡 BONUS | ✅ DONE |
| 4. Documentation | API spec + Postman | 1.5 | 🟡 NICE | ✅ DONE |
| 5. Optimizations | Performance + Mobile | 2 | 🟢 OPTIONAL | 🟢 PENDING |
| **TOTAL MVP** | **Fases 0-2 + 3** | **~17h** | - | **✅ 100% COMPLETE** |
| **FULL MVP** | **Fases 0-3** | **~12-13h** | - | - |

---

## ⏱️ TIMELINE RECOMENDADO

**HOY (Fase 0 + Fase 1): 6 horas**
- Autenticación admin
- Organización por dependencia
- Draft responses
- Admin actions (Aceptar/Modificar/Asignar)
- Learning system

**MAÑANA (Fase 2 + Fase 3): 5-6 horas**
- Validaciones y error handling
- Real-time suggestions
- Email inbox import (CONECTA FACTOR #3)
- UI multicanal

**DÍA PRESENTACIÓN: 1-2 horas**
- Pruebas end-to-end
- Pitch rehearsal
- Ajustes finales

---

## 📝 CHECKLIST DEMO DAY (REQUERIMIENTOS FUNCIONALES)

**Ciudadano (Sin Login):**
- [x] Acceso directo a `/user` ✅
- [x] Selecciona canal (web, email, chat, etc.) ✅
- [x] Escribe solicitud (min 20 chars) ✅
- [x] Envía sin autenticación ✅
- [x] Ve confirmación ✅

**Admin (Con Login):**
- [x] Accede a `/admin/login` ✅
- [x] Ingresa email/password ✅
- [x] Ve inbox filtrado por su dependencia ✅
- [x] Clickea PQRS → Ver detalle ✅
- [x] Analiza con IA ✅
- [x] **[NUEVO]** Escribe pre-respuesta ✅
- [x] **[NUEVO]** Guarda como borrador (SIN ENVIAR) ✅
- [x] **[NUEVO]** Aceptar clasificación ✅
- [x] **[NUEVO]** Modificar clasificación ✅
- [x] **[NUEVO]** Asignar a dependencia ✅
- [x] **[NUEVO]** Ver stats de impacto ✅

**Sistema (Backend):**
- [x] Pre-clasifica automáticamente ✅
- [x] Aprende de correcciones del admin ✅
- [x] Muestra confianza de clasificación ✅
- [x] **[NUEVO]** Importa correos (parse) ✅
- [x] **[NUEVO]** Guarda pre-respuestas sin enviar ✅
- [x] **[NUEVO]** Registra cambios para learning ✅

**Impacto (Lo que demostramos):**
- [x] "Antes: 1 admin clasificaba 10 PQRS/hora manualmente" ✅
- [x] "Ahora: 1 admin valida 20 PQRS/hora con IA" ✅
- [x] "Reducción: 70% del tiempo en clasificación" ✅
- [x] "Diferenciador: Sistema aprende del humano" ✅

---

## 🚀 MVP FINAL = Fases 0 + 1 + 2 (Parcial)

Esto cubre los 3 factores:
1. ✅ Mala clasificación → IA pre-clasifica + aprende
2. ✅ Textos desordenados → IA resume y extrae keywords
3. ✅ Volumen alto → Admin inbox organizado por departencia + draft responses

**BONUS:** Fase 3 agrega Email Import (Conecta factor #3 completamente)