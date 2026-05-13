# Pizzeria App - Live Tracking Systeem

## 1) Projectbeschrijving en functionaliteiten

Deze applicatie vormt een deel van het interne IT-systeem van een restaurantketen en biedt een volledige live-tracking oplossing voor leveringen. Het project is opgebouwd uit twee geïntegreerde interfaces:

**a) Front-Dashboard**
- Beheersinstrument voor restaurantverantwoordelijken
- Volledig overzicht van alle bestellingen met mogelijkheid tot statusupdates
- Live kaartweergave voor het volgen van actieve drivers
- Real-time updates via WebSockets

**b) Driver-Dashboard**
- Interface voor restaurant-drivers
- Aanbieders kunnen leveringen beheren en accepteren
- Geïntegreerde GPS-navigatie met kaartweergave
- Roulupdates voor klanten

Deze applicatie wordt aangevuld met een statische website (pizzeria-websites) voor klantinteractie en bestellingen.

## 2) Gebruikte API's

De applicatie maakt gebruik van een zelf-gebouwde RESTful API-architectuur. Deze API-endpoints verzorgen alle communicatie tussen frontend-interfaces en de PostgreSQL-database, waardoor real-time datamanagementen en synchronisatie worden gewaarborgd.

## 3) Implementatie van elke technische vereiste:


### 3.1) DOM Manipulatie
- **A) Elementen selecteren:** [pizzeria-websites/bestellen/pickupOrder.html](pizzeria-websites/bestellen/pickupOrder.html#L165-L179)
- **B) Elementen manipuleren:** [pizzeria-websites/bestellen/pickupOrder.html](pizzeria-websites/bestellen/pickupOrder.html#L142-L157)
- **C) Events aan elementen koppelen:** [pizzeria-websites/bestellen/pickupOrder.html](pizzeria-websites/bestellen/pickupOrder.html#L209-L212)

### 3.2) Modern JavaScript
- **A) Gebruik van constanten:** [pizzeria-app/backend/server.js](pizzeria-app/backend/server.js#L5-L12)
- **B) Template literals:** [pizzeria-app/backend/routes/driver.js](pizzeria-app/backend/routes/driver.js#L159)
- **C) Iteratie over arrays:** [pizzeria-app/frontend/src/pages/FrontDashboard.jsx](pizzeria-app/frontend/src/pages/FrontDashboard.jsx#L196-L204)
- **D) Array methods:** [pizzeria-app/frontend/src/pages/DriverNavigationPage.jsx](pizzeria-app/frontend/src/pages/DriverNavigationPage.jsx#L82-L84)
- **E) Arrow functions:** [pizzeria-app/frontend/src/pages/DriverDashboard.jsx](pizzeria-app/frontend/src/pages/DriverDashboard.jsx#L28-L46)
- **F) Conditional operator:** [pizzeria-app/frontend/src/config/api.js](pizzeria-app/frontend/src/config/api.js#L29)
- **G) Callback functions:** [pizzeria-app/frontend/src/pages/FrontDashboard.jsx](pizzeria-app/frontend/src/pages/FrontDashboard.jsx#L67-L90)
- **H) Promises:** [pizzeria-app/frontend/src/pages/FrontDashboard.jsx](pizzeria-app/frontend/src/pages/FrontDashboard.jsx#L358)
- **I) Async & Await:** [pizzeria-app/backend/scripts/insert_testData.js](pizzeria-app/backend/scripts/insert_testData.js#L187-L204)
- **J) Observer API:** Geïmplementeerd via Socket.IO event listeners

### 3.3) Data & API
- **A) Fetch om data op te halen:** [pizzeria-app/frontend/src/pages/FrontDashboard.jsx](pizzeria-app/frontend/src/pages/FrontDashboard.jsx#L406-L413)
- **B) JSON manipuleren en weergeven:** [pizzeria-app/frontend/src/pages/FrontDashboard.jsx](pizzeria-app/frontend/src/pages/FrontDashboard.jsx#L413-L415) en [pizzeria-app/frontend/src/pages/FrontDashboard.jsx](pizzeria-app/frontend/src/pages/FrontDashboard.jsx#L646-L657)

### 3.4) Opslag & Validatie
- **A) Formulier validatie:** [pizzeria-app/frontend/src/pages/LoginPage.jsx](pizzeria-app/frontend/src/pages/LoginPage.jsx#L68-L89)
- **B) Gebruik van LocalStorage:** [pizzeria-app/frontend/src/lib/session.js](pizzeria-app/frontend/src/lib/session.js#L1-L22)

### 3.5) Styling & Layout
- **A) Basis HTML layout:** [pizzeria-app/frontend/src/components/DashboardLayout.jsx](pizzeria-app/frontend/src/components/DashboardLayout.jsx#L33-L56)
- **B) Basis CSS:** [pizzeria-app/frontend/src/index.css](pizzeria-app/frontend/src/index.css#L1-L40)
- **C) Gebruiksvriendelijke elementen:** [pizzeria-app/frontend/src/pages/FrontDashboard.jsx](pizzeria-app/frontend/src/pages/FrontDashboard.jsx#L538-L551) en [pizzeria-app/frontend/src/pages/FrontDashboard.jsx](pizzeria-app/frontend/src/pages/FrontDashboard.jsx#L561-L578)

### 3.6) Tooling & Structuur
- **A) Project opgezet met Vite:** [pizzeria-app/frontend/package.json](pizzeria-app/frontend/package.json#L6-L10) en [pizzeria-app/frontend/vite.config.js](pizzeria-app/frontend/vite.config.js#L1-L47)
- **B) Correcte folderstructuur:** [pizzeria-app/frontend/src](pizzeria-app/frontend/src) (components/, pages/, lib/, config/)


## 4) Installatiehandleiding

De applicatie kan op twee manieren worden geïnstalleerd: lokaal voor ontwikkeling of gehost op Render met Supabase voor productiegerbruik.

### Lokale Installatie (Optie 1 - Aanbevolen voor ontwikkeling)

#### Vereisten
- Node.js 16+ en npm
- PostgreSQL 12+ lokaal geïnstalleerd en actief

#### Stappen

**1. Database-configuratie**

Maak een `.env`-bestand aan in `pizzeria-app/backend/`:

```env
PORT=8000
USE_SUPABASE=false
PGHOST=localhost
PGPORT=5432
PGDATABASE=pizzeria
PGUSER=postgres
PGPASSWORD=jouwwachtwoord
FRONT_LOGIN_PASSWORD=front_wachtwoord
DRIVER_LOGIN_PASSWORD=driver_wachtwoord
```

**2. Dependencies installeren**

```bash
cd pizzeria-app
npm run install:all
```

**3. Database initialiseren met testdata**

```bash
cd pizzeria-app/backend
node scripts/init_db.js
node scripts/insert_testData.js
```

**4. Applicatie starten (twee terminals nodig)**

Terminal 1 - Backend:
```bash
cd pizzeria-app
npm run dev:backend
```

Terminal 2 - Frontend:
```bash
cd pizzeria-app
npm run dev:frontend
```

**5. Toegang in browser**

- Frontend Dashboard: `http://localhost:5174`
- Backend Health Check: `http://localhost:8000/health`
- Inloggegevens:
  - **Front Dashboard:** password = `front_wachtwoord`
  - **Driver Dashboard:** password = `driver_wachtwoord`

### Gehoste Installatie (Optie 2 - Productie)

De applicatie is beschikbaar op: **https://pizzeria-frontend-mwio.onrender.com**

Deze versie maakt verbinding met een PostgreSQL-database gehost op Supabase en wordt automatisch gedeployd naar Render bij updates.

## 5) Screenshots

*Screenshots zullen hier worden toegevoegd*

## 6) Gebruikte bronnen

Deze applicatie is ontwikkeld met gebruikmaking van:
- GitHub Copilot VS Code extensie
- React + Vite framework
- Socket.IO voor real-time communicatie
- Leaflet.js voor kaartfunctionaliteit
- PostgreSQL voor database management

Chatlogs en discussies met Copilot zijn te vinden in `pizzeria-websites/ChatlogsCopilot/`


