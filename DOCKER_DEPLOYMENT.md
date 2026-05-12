# Docker Deployment Guide for Pizzeria App

## Files Created

- `backend/Dockerfile` - Docker image for Express backend
- `frontend/Dockerfile` - Docker image for React frontend with Nginx
- `docker-compose.yml` - Orchestrates all services locally
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
git add . && git commit -m "Add Docker setup" && git push
```

### 2. Create Railway Project & Login
1. Go to [railway.app](https://railway.app)
2. Click **"Login with GitHub"**
3. Authorize Railway
4. Click **"Create New Project"**
5. Select **"Deploy from GitHub repo"**
6. Find and select **pizzeria-app** repository

### 3. Railway Auto-Detection
Railway will detect your Dockerfiles and create services. Go to **"Services"** panel.

You should have (or need to add):
- ✅ One service auto-created from repo
- ⚠️ You need to create 2 more services

### 4. Add Missing Services

#### Service: Frontend
1. Click **"+ New Service"** → **"GitHub Repo"**
2. Select pizzeria-app repo again
3. In settings:
   - **Root Directory**: `frontend`
   - **Dockerfile**: `Dockerfile`
   - Save

#### Service: Backend  
1. Click **"+ New Service"** → **"GitHub Repo"**
2. Select pizzeria-app repo
3. In settings:
   - **Root Directory**: `backend`
   - **Dockerfile**: `Dockerfile`
   - Save

#### Service: Database (PostgreSQL)
1. Click **"+ New Service"** → **"Database"** → **"PostgreSQL"**
2. Railway creates it automatically

### 5. Configure Environment Variables

Go to each service → **"Variables"** tab → Add these:

**Backend Service:**
```
NODE_ENV=production
PORT=8000
PGHOST=${{Postgres.PGHOST}}
PGPORT=${{Postgres.PGPORT}}
PGUSER=${{Postgres.PGUSER}}
PGPASSWORD=${{Postgres.PGPASSWORD}}
PGDATABASE=pizzeria
RATE_LIMIT_MAX=300
CORS_ORIGIN=${{Frontend.RAILWAY_PUBLIC_DOMAIN}}
```

**Frontend Service:**
```
VITE_API_URL=https://${{Backend.RAILWAY_PUBLIC_DOMAIN}}
```

**PostgreSQL:**
- Usually auto-configured by Railway

### 6. Deploy & Generate URLs

1. Click **"Deploy"** button (or auto-deploys on push)
2. Wait for building to complete (green checkmark ✅)
3. For each service → **"Networking"** tab → **"Generate Domain"**

**Your app will be live at:**
- Frontend: `https://pizzeria-xxx.railway.app`
- Backend: `https://pizzeria-backend-xxx.railway.app`
- Database: Managed by Railway (private)

### 7. Test It Works

```bash
# Test backend health
curl https://pizzeria-backend-xxx.railway.app/health

# Visit frontend in browser
https://pizzeria-xxx.railway.app
```

**Congrats! 🎉 Your app is live!**

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
