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


### Login voor frontend app

- Login endpoint: `POST /api/auth/login`
- Vereiste body: `role` (`front` of `driver`), `identifier` (branch/driver id), `password`
- Zet in `backend/.env`:
	- `FRONT_LOGIN_PASSWORD`
	- `DRIVER_LOGIN_PASSWORD`

