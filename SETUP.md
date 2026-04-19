# 🎯 Guía de Ejecución - MVP OmegaHack 2026

## Paso 1: Preparar PostgreSQL Local

### En PowerShell o Command Prompt:

```bash
# Crear la base de datos
createdb PQRSDf_db

# Crear la tabla (conectar a la BD y ejecutar el SQL)
psql PQRSDf_db -f "c:\Users\samir\Desktop\OmegaHack2026\backend\scripts\init.sql"
```

**Verificar que funcionó:**
```bash
psql PQRSDf_db -c "SELECT * FROM PQRSDf;"
```

Debería mostrar una tabla vacía (sin errores).

---

## Paso 2: Iniciar Backend (Terminal 1)

```bash
cd c:\Users\samir\Desktop\OmegaHack2026\backend

# Instalar dependencias (ya está hecho)
npm install

# Iniciar servidor
npm start
```

**Debe mostrar:**
```
Server running on port 8000
```

**Verificar que funciona:**
```bash
# En otra terminal
curl http://localhost:8000/health
# Debe responder: {"status":"OK"}
```

---

## Paso 3: Iniciar Frontend (Terminal 2)

```bash
cd c:\Users\samir\Desktop\OmegaHack2026\frontend

# Instalar dependencias (ya está hecho)
npm install

# Iniciar servidor
npm run dev
```

**Debe mostrar URL:**
```
Local:        http://localhost:5173
```

Abre en navegador: http://localhost:5173

---

## Paso 4: Probar el Flujo Completo

### 4A. Enviar PQRSDfDf (Lado Ciudadano)

1. En navegador, ve a http://localhost:5173
2. Haz clic en **"Enviar PQRSDfDf"** (botón azul)
3. Llena el formulario:
   - **Canal**: Selecciona "🌐 Sitio Web"
   - **Solicitud**: Escribe algo como:
     ```
     "La vía en la carrera 45 con calle 10 está muy dañada.
     Hay huecos grandes que ponen en riesgo a los vehículos."
     ```
4. Haz clic **"✅ Enviar Solicitud"**
5. Deberías ver: "✅ PQRSDfDf enviada exitosamente!"

---

### 4B. Ver en Admin Inbox (Lado Administrador)

1. Ve a http://localhost:5173
2. Haz clic en **"Panel Admin"** (botón morado)
3. Deberías ver tu solicitud en la lista:
   ```
   🌐 Sin clasificar | ⏳ Pendiente | Preview del texto...
   ```

**Estadísticas en la parte inferior:**
- Pendientes: 1
- Analizadas: 0
- Asignadas: 0
- Resueltas: 0

---

### 4C. Analizar con IA

1. Haz clic en tu solicitud en el inbox
2. Verás la pantalla dividida:
   - **Izquierda**: Tu solicitud original
   - **Derecha**: Estado y botones de acciones
3. En la parte superior, verás el botón azul **"🤖 Analizar con IA"**
4. Haz clic en él
5. Espera 2-3 segundos (o 10-15 si usas OpenAI real)
6. La página se actualizará automáticamente con:
   - **Clasificación**: "Infraestructura"
   - **Confianza**: 85-95%
   - **Resumen**: Texto estructurado
   - **Temas**: ["vías", "reparación", etc.]
   - **Alerta**: Si detecta multi-dependencias

---

### 4D. Acciones del Admin

Una vez analizado:

1. **Cambiar Estado**:
   - Dropdown en "Estado" para cambiar: Pendiente → Analizado → Asignado → Resuelto

2. **Aceptar Clasificación**:
   - Botón verde "✅ Aceptar Clasificación"

3. **Modificar Clasificación**:
   - Botón amarillo "✏️ Modificar Clasificación" (TBD en siguiente iteración)

4. **Asignar a Dependencia**:
   - Botón azul "📤 Asignar a Dependencia" (TBD)

---

## Paso 5: Probar Multicanal

El sistema simula diferentes canales:

1. Envía solicitudes por diferentes canales en `/user`:
   - 📧 Email
   - 💬 Chat
   - ☎️ Teléfono
   - 📱 Redes Sociales

2. En el admin inbox, cada una aparecerá con su ícono correspondiente

3. Todas se analizan de la misma manera

---

## Paso 6: Verificar BD

```bash
# Ver todas las solicitudes en PostgreSQL
psql PQRSDf_db -c "SELECT id, status, classification, confidence FROM PQRSDf;"
```

**Ejemplo de output:**
```
 id | status   | classification | confidence
----|----------|----------------|------------
  1 | pending  | NULL           | NULL
  2 | analyzed | Infraestructura| 87
  3 | assigned | Movilidad      | 92
```

---

## 🐛 Troubleshooting

### ❌ "Connection refused" al iniciar backend

**Solución:**
1. Verifica que PostgreSQL esté corriendo
2. Verifica las credenciales en `backend/.env`
3. Intenta conectar directamente:
   ```bash
   psql -U postgres
   ```

### ❌ Backend inicia pero no hay datos

**Verifica:**
```bash
psql PQRSDf_db -c "\dt"  # Ver tablas
psql PQRSDf_db -c "SELECT * FROM PQRSDf;"  # Ver datos
```

Si la tabla no existe, re-ejecuta:
```bash
psql PQRSDf_db -f "backend/scripts/init.sql"
```

### ❌ Frontend no ve el backend

**Verificar:**
1. Backend está en http://localhost:8000 ✓
2. Puedes hacer curl:
   ```bash
   curl http://localhost:8000/api/PQRSDf
   ```
   Debe retornar JSON

3. CORS está habilitado en `backend/server.js` ✓

### ❌ IA no clasifica correctamente

**Si usas Mock (por defecto):**
- Revisa `backend/knowledge_base.json`
- Agrega más keywords para mejorar

**Si usas OpenAI:**
1. Verifica API key en `backend/.env`
2. Verifica que tienes saldo en OpenAI
3. Revisa logs del backend

---

## 📊 Demo Script (Copia y Pega)

Envia 3 solicitudes automáticas:

**Terminal (en el folder del proyecto):**
```bash
# Solicitud 1: Infraestructura
curl -X POST http://localhost:8000/api/ingest \
  -H "Content-Type: application/json" \
  -d '{"content":"La vía en carrera 45 está dañada, hay muchos huecos","channel":"web"}'

# Solicitud 2: Movilidad  
curl -X POST http://localhost:8000/api/ingest \
  -H "Content-Type: application/json" \
  -d '{"content":"Los semáforos en la calle 10 no funcionan correctamente","channel":"email"}'

# Solicitud 3: Seguridad
curl -X POST http://localhost:8000/api/ingest \
  -H "Content-Type: application/json" \
  -d '{"content":"Ha habido robos frecuentes en el parque de mi barrio","channel":"phone"}'

# Ver todas
curl http://localhost:8000/api/PQRSDf
```

Luego abre http://localhost:5173/admin y verás las 3 solicitudes.

---

## ✅ Checklist Final

- [ ] PostgreSQL corriendo
- [ ] Backend iniciado en puerto 8000
- [ ] Frontend iniciado en puerto 5173
- [ ] Puedo acceder a http://localhost:5173
- [ ] Puedo enviar una PQRSDfDf
- [ ] Aparece en el admin inbox
- [ ] Puedo analizarla con IA
- [ ] Aparecen clasificación, resumen y topics
- [ ] Puedo cambiar estado

**Si todo ✅ → MVP Funcional ✅**

---

## 📹 Notas para el Pitch

Durante la presentación:

1. **Mostrar Home**: "Dos lados del sistema - Ciudadano y Admin"
2. **Enviar PQRSDfDf**: "Simple, sin autenticación, solo lo importante"
3. **Ver en Admin**: "Inbox Gmail-like para gestión rápida"
4. **Analizar**: "IA automática - clasificación + resumen + topics"
5. **Cambiar Estado**: "Humano valida y decide - no reemplazamos"
6. **Multicanal**: "Email, Chat, Web, Teléfono, Redes - todo centralizado"

---

¡Listo! Ahora deberías tener un MVP completamente funcional. 🚀