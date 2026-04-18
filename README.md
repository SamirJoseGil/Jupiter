# Jupiter

Sistema centralizado para gestión de PQRSDs (Peticiones, Quejas, Reclamos, Sugerencias, Denuncias) con procesamiento inteligente.

---

## Problema

- **Mala clasificación:** Solicitudes llegan a departamento incorrecto
- **Textos desordenados:** Ciudadanos envían información desorganizada
- **Volumen alto:** Especialmente por email, difícil de procesar manualmente

## Solución

Plataforma que centraliza PQRSD de múltiples canales, pre-clasifica automáticamente y asiste al administrador en la gestión.

---

## Tech Stack

- **Backend:** Express.js + PostgreSQL
- **Frontend:** Remix v2 + React 18 + Tailwind CSS
- **AI:** Mock classification (OpenAI ready)

---

## Quick Start

### Backend
```bash
cd backend
npm install
npm start
```
Servidor en `http://localhost:8000`

### Frontend
```bash
cd frontend
npm install
npm run dev
```
App en `http://localhost:5173`

**Database:** Auto-inicializa en primer boot

---

## Project Structure

```
backend/              # Express API + PostgreSQL

frontend/             # Remix application

data/

challenges/ 
```