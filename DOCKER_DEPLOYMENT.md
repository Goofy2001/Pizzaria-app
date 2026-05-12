# Docker Deployment Guide for Pizzeria App

## Files Created

- `Dockerfile.backend` - Docker image for Express backend
- `Dockerfile.frontend` - Docker image for React frontend with Nginx
- `docker-compose.yml` - Local development with database
- `frontend/nginx.conf` - Nginx configuration for frontend
- `.dockerignore` - Files to exclude from Docker images
- `.env.example` - Environment variables template

## Local Testing

### 1. Create .env file from template
```bash
cp .env.example .env
# Edit .env with your PostgreSQL password
```

### 2. Run with Docker Compose
```bash
docker-compose up
```

This will start:
- **PostgreSQL Database** on `localhost:5432`
- **Backend** on `localhost:8000` (health check: `/health`)
- **Frontend** on `localhost:80` (http://localhost)

### 3. Test the setup
```bash
# Test backend
curl http://localhost:8000/health

# Open frontend
open http://localhost
```

### 4. Stop containers
```bash
docker-compose down
```

---

## Deployment on Railway

### 1. Push to GitHub
```bash
git add .
git commit -m "Add Docker configuration"
git push origin main
```

### 2. Create Railway Project
- Go to [railway.app](https://railway.app)
- Sign up with GitHub
- Click "Create New Project"
- Select "Deploy from GitHub repo"
- Select your pizzeria-app repository

### 3. Configure Services

#### Backend Service
1. Click "New Service" → "GitHub Repo"
2. Select your repo
3. Set Build Command: `npm install --prefix backend`
4. Set Start Command: `npm start --prefix backend`

#### Frontend Service
1. Click "New Service" → "GitHub Repo"
2. Same repo
3. Set Build Command: `npm run build --prefix frontend`
4. Set Start Command: (leave empty - Nginx serves static files)

#### Database Service
1. Click "New Service" → "Database" → "PostgreSQL"
2. Railway creates database automatically

### 4. Environment Variables
Set in Railway dashboard:
```
NODE_ENV=production
PORT=8000
PGHOST=${{Postgres.PGHOST}}
PGUSER=${{Postgres.PGUSER}}
PGPORT=${{Postgres.PGPORT}}
PGPASSWORD=${{Postgres.PGPASSWORD}}
PGDATABASE=${{Postgres.PGDATABASE}}
CORS_ORIGIN=https://your-frontend-domain.railway.app
VITE_API_URL=https://your-backend-domain.railway.app
```

### 5. Deploy
Railway auto-deploys on every push. Your app will be live at:
- **Frontend**: `https://your-app-xxx.railway.app`
- **Backend**: `https://your-backend-xxx.railway.app`

---

## Deployment on Combell (Student Pass)

### 1. Push to GitHub
Same as Railway

### 2. Access Combell Control Panel
- Log in to your Combell account
- Go to "Hosting" section

### 3. Create Docker Container Service
1. Find "Docker" or "Container" option
2. Click "Create new Docker service"
3. Connect to GitHub repository
4. Select your pizzeria-app repository

### 4. Configure Container

#### Backend Container
```
Dockerfile: Dockerfile.backend
Port: 8000
Environment Variables:
  NODE_ENV=production
  PGHOST=postgres-host-from-combell
  PGUSER=your-pg-user
  PGPASSWORD=your-pg-password
  PGDATABASE=pizzeria
```

#### Frontend Container
```
Dockerfile: Dockerfile.frontend
Port: 80
```

#### Database (PostgreSQL)
- Use Combell's managed PostgreSQL or Docker container
- Note: Some shared hosting may limit Docker support

### 5. Domain Setup
1. Point your domain to Combell's servers
2. Configure DNS records
3. Set `CORS_ORIGIN` environment variable to your domain

### 6. Deploy
- Combell deploys on push (if configured)
- Or manually deploy from control panel

---

## Troubleshooting

### Database Connection Issues
```bash
# Test locally
docker-compose logs database

# Check environment variables
docker-compose exec backend env | grep PG
```

### Frontend Not Loading API
- Check `VITE_API_URL` environment variable
- Ensure `CORS_ORIGIN` includes frontend domain
- Check nginx.conf proxy settings

### Port Already in Use
```bash
# Kill existing containers
docker-compose down

# Or change ports in docker-compose.yml
```

### Build Fails
```bash
# Rebuild images
docker-compose build --no-cache

# Check logs
docker-compose logs
```

---

## Production Recommendations

1. **Database Backups**: Enable automatic backups on Railway/Combell
2. **Environment Secrets**: Store passwords in environment variables, never in code
3. **Health Checks**: Backend has built-in `/health` endpoint
4. **Rate Limiting**: Configured in backend (300 requests per 15 minutes)
5. **HTTPS**: Both Railway and Combell provide SSL certificates
6. **Monitoring**: Use Railway/Combell dashboards to monitor usage

---

## Next Steps

- Deploy to Railway (free $5/month credits)
- Or configure on Combell with your student pass
- Test: `curl https://your-domain/api/health`
- Monitor logs in dashboard

Questions? Check the logs:
```bash
# Local
docker-compose logs -f backend

# Railway: Check dashboard logs
# Combell: Check hosting logs panel
```
