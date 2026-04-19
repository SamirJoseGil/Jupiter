# Jupiter Backend Endpoints

Base URL: http://localhost:8000

Autenticacion:
- Tipo: Bearer JWT
- Header: Authorization: Bearer <token>

## Health

### GET /health
Descripcion: Verifica estado del servicio.
Auth: No

Request:
- Sin body

Response 200:
```json
{
  "status": "OK",
  "timestamp": "2026-04-18T23:30:00.000Z"
}
```

## Auth

### POST /api/auth/register
Descripcion: Registra administrador.
Auth: No

Request body:
```json
{
  "email": "admin@jupiter.test",
  "password": "Admin123456",
  "department": "Infraestructura"
}
```

Response 201:
```json
{
  "message": "User created successfully",
  "token": "<jwt>",
  "user": {
    "id": 1,
    "email": "admin@jupiter.test",
    "department": "Infraestructura"
  }
}
```

Errores:
- 400: Email/password invalidos o ya existe email

### POST /api/auth/login
Descripcion: Login de administrador.
Auth: No

Request body:
```json
{
  "email": "admin@jupiter.test",
  "password": "Admin123456"
}
```

Response 200:
```json
{
  "message": "Login successful",
  "token": "<jwt>",
  "user": {
    "id": 1,
    "email": "admin@jupiter.test",
    "department": "Infraestructura"
  }
}
```

Errores:
- 400: faltan campos
- 401: credenciales invalidas

### GET /api/auth/me
Descripcion: Usuario autenticado actual.
Auth: Si

Request:
- Header Authorization requerido

Response 200:
```json
{
  "user": {
    "id": 1,
    "email": "admin@jupiter.test",
    "department": "Infraestructura",
    "is_active": true
  }
}
```

Errores:
- 401: token invalido o ausente
- 404: usuario no encontrado

## PQRSDfDf

### POST /api/ingest
Descripcion: Crea nueva PQRSDfDf (ciudadano).
Auth: No

Request body:
```json
{
  "content": "Mi solicitud es sobre reparacion de vias en el barrio X.",
  "channel": "web"
}
```

Reglas:
- content: string, 20 a 5000 caracteres
- channel: web | email | chat | phone | social

Response 201:
```json
{
  "message": "PQRSDfDf submitted successfully",
  "pqr": {
    "id": 12,
    "content": "Mi solicitud es sobre reparacion de vias en el barrio X.",
    "channel": "web",
    "status": "pending",
    "created_at": "2026-04-18T23:30:00.000Z"
  }
}
```

Errores:
- 400: validacion de contenido/canal

### POST /api/analyze/:id
Descripcion: Analiza PQRSDfDf con IA.
Auth: Si (admin)

Request:
- Path param: id (numero)
- Sin body

Response 200:
```json
{
  "message": "Analysis completed",
  "pqr": {
    "id": 12,
    "classification": "Infraestructura",
    "confidence": 87,
    "summary": "Solicitud sobre reparacion de vias...",
    "topics": ["vias", "reparacion"],
    "multi_dependency": false,
    "assigned_department": "Infraestructura",
    "status": "analyzed"
  }
}
```

Errores:
- 401: no autenticado
- 404: no existe PQR
- 500: error de IA

### GET /api/PQRSDf
Descripcion: Lista PQRSDfDf (con filtros).
Auth: Si (admin)

Query params opcionales:
- status: pending | analyzed | assigned | resolved
- department: string
- limit: integer (max 1000)

Response 200:
```json
{
  "PQRSDf": [
    {
      "id": 12,
      "content": "...",
      "channel": "web",
      "classification": "Infraestructura",
      "confidence": 87,
      "status": "analyzed",
      "created_at": "2026-04-18T23:30:00.000Z"
    }
  ]
}
```

Errores:
- 401: no autenticado

### GET /api/PQRSDf/:id
Descripcion: Obtiene detalle de una PQRSDfDf.
Auth: Si (admin)

Request:
- Path param: id (numero)

Response 200:
```json
{
  "pqr": {
    "id": 12,
    "content": "...",
    "channel": "web",
    "classification": "Infraestructura",
    "confidence": 87,
    "summary": "...",
    "topics": ["vias"],
    "status": "analyzed",
    "created_at": "2026-04-18T23:30:00.000Z"
  }
}
```

Errores:
- 400: id invalido
- 401: no autenticado
- 404: no encontrado

### PUT /api/PQRSDf/:id/status
Descripcion: Actualiza estado.
Auth: Si (admin)

Request body:
```json
{
  "status": "assigned"
}
```

Valores permitidos status:
- pending
- analyzed
- assigned
- resolved

Response 200:
```json
{
  "message": "Status updated",
  "pqr": {
    "id": 12,
    "status": "assigned",
    "updated_at": "2026-04-18T23:35:00.000Z"
  }
}
```

## Email Automation (n8n)

### POST /api/webhooks/n8n/email
Descripcion: Ingesta automatica de correos desde n8n. Crea PQRSDfDf, ejecuta clasificacion IA y guarda trazabilidad en email_ingestions.
Auth: Webhook secret por header

Headers requeridos:
- x-webhook-secret: debe coincidir con N8N_WEBHOOK_SECRET

Body soportado:
- Objeto unico con campos from, subject, content, messageId (o variantes sender/body/text/id)
- O arreglo de objetos
- O { "emails": [ ... ] }

Request body ejemplo:
```json
{
  "emails": [
    {
      "from": "ciudadano@correo.com",
      "subject": "Hueco en la via principal",
      "content": "Hace semanas hay un hueco grande frente al colegio...",
      "messageId": "gmail-abc-123"
    }
  ]
}
```

Response 200:
```json
{
  "message": "n8n email webhook processed",
  "total": 1,
  "processed": 1,
  "failed": 0,
  "results": [
    {
      "externalMessageId": "gmail-abc-123",
      "duplicated": false,
      "pqrId": 35
    }
  ],
  "errors": []
}
```

Errores:
- 401: webhook secret invalido
- 503: N8N_WEBHOOK_SECRET no configurado
- 500: fallo interno de procesamiento

Errores:
- 400: status invalido
- 401: no autenticado

### PUT /api/PQRSDf/:id/assign
Descripcion: Asigna solicitud a dependencia/usuario.
Auth: Si (admin)

Request body:
```json
{
  "userId": 1,
  "department": "Infraestructura"
}
```

Response 200:
```json
{
  "message": "PQR assigned",
  "pqr": {
    "id": 12,
    "assigned_to_user_id": 1,
    "assigned_department": "Infraestructura",
    "status": "assigned"
  }
}
```

Errores:
- 400: falta department o id invalido
- 401: no autenticado

## Swagger

- UI: http://localhost:8000/api/docs
- JSON: http://localhost:8000/api/docs.json

Flujo recomendado para frontend:
1. Login en /api/auth/login
2. Guardar token JWT
3. Enviar token en Authorization para endpoints protegidos
4. Usar /api/docs para validar request/response durante desarrollo
