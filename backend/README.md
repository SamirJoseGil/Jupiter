# Jupiter Backend

Express.js API for Jupiter PQRSD management system.

## Development

```bash
npm install
npm start
```

Server runs on `http://localhost:8000`

## Stack

- Express.js
- PostgreSQL
- Node.js

## Environment

Create `.env` file:
```
DATABASE_URL=postgresql://user:password@localhost/pqrs_db
PORT=8000
```

## Database

PostgreSQL auto-initializes on server start.
