# 🧠 VISIÓN GLOBAL (lo que realmente estás construyendo)

> Plataforma que **centraliza PQRSDs multicanal**, las **entiende automáticamente** y permite a un funcionario **tomar decisiones rápidas con apoyo de IA**.

No son dos apps.
Es **un solo sistema con dos caras**:

```text
[ Usuario ] → [ Ingesta ] → [ IA ] → [ Sistema ] → [ Admin ]
```

---

# 🎯 LOS DOS LADOS DEL SISTEMA

---

## 👤 1. LADO USUARIO (simple, no te emociones)

### Qué hace:

Permite enviar la PQRSD.

### UI:

* Formulario básico:

  * texto libre (lo importante)
  * opcional: nombre/tipo

---

### 💡 Extra (si te alcanza):

* sugerencia automática mientras escribe
* “detectamos que estás solicitando…”

Esto vende muy bien visualmente.

---

### ⚠️ Regla:

Nada de:

* login
* validaciones complejas
* features innecesarias

El usuario no es el protagonista.

---

## 🧑‍💼 2. LADO ADMIN (aquí ganas)

### 🖥️ Inbox multicanal

Lista tipo Gmail:

* canal (📧 💬 🌐)
* preview del mensaje
* estado
* prioridad

---

### 📂 Vista detalle (la pieza clave)

Pantalla dividida:

#### IZQUIERDA:

* texto original
* con highlights inteligentes

#### DERECHA:

* 📍 clasificación sugerida
* 🎯 nivel de confianza
* 🧠 resumen estructurado
* 🧩 temas detectados
* ⚠️ alertas (multidependencia, ambigüedad)

---

### 🔁 Acciones del admin

* aceptar clasificación
* modificar
* cambiar estado

👉 IMPORTANTE:
el humano valida → cumples con el reto.

---

### 🔥 Feature que te sube de nivel

Cuando el admin corrige algo:

→ guardas el cambio
→ en el pitch dices:

> “el sistema aprende del comportamiento humano”

Aunque sea básico. Funciona.

---

# ⚙️ ARQUITECTURA (REALISTA PERO PRO)

---

## 🔹 Frontend

* React + Tailwind
* Vistas:

  * formulario usuario
  * inbox admin
  * detalle PQRSD

---

## 🔹 Backend (separado, como quieres)

* Node.js + Express

Endpoints:

* `POST /ingest`
* `POST /analyze`
* `GET /pqr`

---

## 🔹 Base de datos

Tabla PQRSD:

```sql
id
content
channel
classification
confidence
summary
status
created_at
```

---

## 🔹 Base de conocimiento (clave)

```json
{
  "Infraestructura": {
    "keywords": ["vías", "rampas", "espacio público"]
  },
  "Movilidad": {
    "keywords": ["tránsito", "vehículos"]
  }
}
```

Esto te cubre el componente A.

---

# 🧠 IA (EL CORAZÓN)

No entrenas nada.
Usas prompt engineering serio.

---

## 🔥 Prompt base

```
Actúa como analista de PQRSDs en Colombia.

1. Identifica la solicitud principal
2. Clasifica en dependencia
3. Detecta multidependencia
4. Resume:
   - solicitud
   - temas
   - contexto
5. Extrae palabras clave

Devuelve JSON con:
classification, confidence, summary, topics, multi_dependency
```

---

# 🌐 MULTICANAL (LO QUE QUIERES HACER BIEN)

No integras real. Simulas:

### 📧 Email → input tipo correo

### 💬 Chat → UI tipo WhatsApp

### 🌐 Web → formulario

👉 Todo entra al mismo pipeline.

**Esto es tu diferenciador:**

> unificación del caos multicanal

---

# 🔄 FLUJO COMPLETO (TU DEMO)

1. Usuario envía solicitud
2. Sistema analiza
3. Admin recibe todo organizado
4. Admin decide en segundos

💥 Eso gana.

---

# 🎨 UI (NO LA SUBESTIMES)

Haz que el admin sienta:

* claridad
* control
* velocidad

Evita dashboards inútiles.

---

# 🧨 COSAS QUE NO VAS A HACER

* login real ❌
* WhatsApp real ❌
* scraping serio ❌
* microservicios ❌
* features extra ❌

---

# 🎤 NARRATIVA GANADORA

No digas:

> “clasificamos texto”

Di:

> “centralizamos y organizamos solicitudes multicanal para reducir carga operativa en el sector público”

---