# Pizzaria-app

Project is opgesplitst in:

- `backend/` → Express + Socket.IO + PostgreSQL API
- `frontend/` → React + Vite client

## Snelle setup

1. Kopieer `backend/.env.example` naar `backend/.env`
2. Vul je PostgreSQL gegevens in (`PGUSER`, `PGPASSWORD`, ...)
3. Zet een sterke `INTERNAL_API_KEY`
4. Installeer alles:

```bash
npm run install:all
```

## Runnen

Terminal 1 (backend):

```bash
npm run dev:backend
```

Terminal 2 (frontend):

```bash
npm run dev:frontend
```

Standaard:

- Backend: `http://localhost:8000`
- Frontend (Vite): `http://localhost:5173`

Vite proxyt automatisch `/api` en `/socket.io` naar de backend.

## Docker

Je kunt de volledige stack ook met Docker starten:

```bash
docker compose up --build
```

Daarna:

- Frontend: `http://localhost:8080`
- Backend: `http://localhost:8000`
- PostgreSQL: `localhost:5432`

De database wordt bij het opstarten geïnitialiseerd en gevuld met testdata.

## Railway

Voor Railway kun je één service deployen met de root [Dockerfile](Dockerfile).

Instellen:

- voeg een PostgreSQL service toe in Railway
- laat Railway de `DATABASE_URL` doorgeven aan de backend
- zet eventueel `PGSSLMODE=require` als Railway dat nodig heeft

De frontend wordt tijdens de build meegebouwd en de backend serveert die op dezelfde URL als de API.

### Beveiliging

- `POST`, `PATCH`, `PUT`, `DELETE` op `/api/branch`, `/api/orders`, `/api/drivers` vereisen header `x-api-key`
- Voorbeeld:

```bash
curl -X PATCH http://localhost:8000/api/orders/1/status \
	-H "Content-Type: application/json" \
	-H "x-api-key: jouw-api-key" \
	-d '{"status":"ready"}'
```

- Healthcheck endpoint: `GET /health`
- Test endpoint staat enkel aan buiten productie: `GET /test`

### Login voor frontend app

- Login endpoint: `POST /api/auth/login`
- Vereiste body: `role` (`front` of `driver`), `identifier` (branch/driver id), `password`
- Zet in `backend/.env`:
	- `FRONT_LOGIN_PASSWORD`
	- `DRIVER_LOGIN_PASSWORD`

