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

## Productie (op internet)

Simpelste aanpak: host enkel de backend server en laat die ook de frontend build serveren.

1. Build frontend:

```bash
cd frontend
npm install
npm run build
```

2. Start backend in productie:

```bash
cd ../backend
npm install
NODE_ENV=production npm start
```

3. Zet minimaal deze env variabelen op je host:

- `PORT` (meestal automatisch door hostingplatform)
- `NODE_ENV=production`
- `CORS_ORIGIN=https://jouw-domein.tld`
- `PGHOST`, `PGPORT`, `PGDATABASE`, `PGUSER`, `PGPASSWORD`
- `FRONT_LOGIN_PASSWORD`, `DRIVER_LOGIN_PASSWORD`

4. Open je domein:

- Frontend draait op `/`
- API blijft op `/api/...`
- Socket.IO blijft op `/socket.io/...`

## Deploy op Render

Je project bevat nu een blueprint bestand: `render.yaml`.

### Optie A (snelste): via Blueprint

1. Push `pizzeria-app` naar GitHub.
2. In Render: **New +** → **Blueprint**.
3. Koppel je repo en selecteer `pizzeria-app/render.yaml`.
4. Zet deze env vars in de web service:
	- `CORS_ORIGIN=https://<jouw-render-url>`
	- `FRONT_LOGIN_PASSWORD=<sterk-wachtwoord>`
	- `DRIVER_LOGIN_PASSWORD=<sterk-wachtwoord>`
	- (optioneel) `APP_LOGIN_PASSWORD=<fallback-wachtwoord>`
5. Deploy.

Tijdens de Render build worden nu ook de tabellen aangemaakt en testdata geladen via:

- `backend/scripts/init_db.js`
- `backend/scripts/insert_testData.js`

Dat betekent dat de login direct werkt met testdata, maar ook dat de seed bij een deploy de bestaande inhoud kan overschrijven.

### Database resetten op Render

Als je geen Render Shell wilt gebruiken, kun je de database resetten via een beveiligde API-call.

Stel in Render bij je web service deze env var in:

- `INTERNAL_API_KEY=<sterke-geheime-sleutel>`

Dit is de gratis manier; hiervoor heb je geen betaalde Shell nodig.

Daarna kun je de database resetten met een POST request naar:

- `https://<jouw-render-url>/api/admin/reset-db`

Stuur daarbij de header:

- `x-api-key: <zelfde-geheime-sleutel>`

Voorbeeld:

```bash
curl -X POST https://<jouw-render-url>/api/admin/reset-db \
	-H "x-api-key: <zelfde-geheime-sleutel>"
```

Als je toch wél Shell hebt, kan het ook daar met:

```bash
cd backend && npm run db:reset
```

Dat doet eerst de tabellen opnieuw aanmaken en daarna de testdata opnieuw invullen.
Na deploy gebruik je:

- `https://<jouw-render-url>/` voor de frontend
- `https://<jouw-render-url>/api/...` voor de API

### Optie B: manueel (zonder blueprint)

Maak in Render:

- 1 PostgreSQL service
- 1 Web Service (Node)

Instellingen web service:

- Build Command:

```bash
npm --prefix frontend ci && npm --prefix frontend run build && npm --prefix backend ci
```

- Start Command:

```bash
npm --prefix backend start
```

- Health Check Path: `/health`

Koppel daarna dezelfde env vars als bij Optie A en map de PostgreSQL waarden naar `PGHOST`, `PGPORT`, `PGDATABASE`, `PGUSER`, `PGPASSWORD`.

