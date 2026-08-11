# ConstructTrack - Railway Production Deployment Guide

Hosting **ConstructTrack** on **Railway** (`https://railway.app`) is an ideal choice. Railway provides managed PostgreSQL databases, automatic HTTPS (required for Progressive Web Apps & Service Workers), instant GitHub deployments, and scalable container hosting.

---

## 🏗️ Railway Deployment Architecture

```
                                    +-----------------------------------------+
                                    |             Railway Project             |
                                    +--------------------+--------------------+
                                                         |
                   +-------------------------------------+-------------------------------------+
                   |                                                                           |
                   v                                                                           v
+------------------------------------+                                      +------------------------------------+
|     Managed PostgreSQL Database    |                                      |      Next.js PWA Web Application   |
| • Automatic Connection String      | <=================================== | • Automatic HTTPS SSL Domain       |
| • Executes schema.sql & seed.sql   |           DATABASE_URL               | • Service Worker & Offline Sync    |
| • Stores 3,290 Matrix Tasks        |                                      | • Admin & Field UI                 |
+------------------------------------+                                      +------------------------------------+
```

---

## 📋 Step-by-Step Railway Deployment Process

### Step 1: Push Codebase to GitHub
Ensure your ConstructTrack repository is pushed to GitHub:
```bash
git init
git add .
git commit -m "Initial commit - ConstructTrack v2.2"
git remote add origin https://github.com/your-username/constructtrack.git
git push -u origin main
```

---

### Step 2: Create a New Project on Railway
1. Log in to [Railway.app](https://railway.app).
2. Click **+ New Project**.

---

### Step 3: Add Managed PostgreSQL Database
1. In your Railway project canvas, click **+ New** $\rightarrow$ **Database** $\rightarrow$ **Add PostgreSQL**.
2. Railway will instantly provision a PostgreSQL database instance.
3. Click on the PostgreSQL database service $\rightarrow$ navigate to **Variables** tab.
4. Copy the `DATABASE_URL` variable (e.g. `postgresql://postgres:password@roundhouse.proxy.rlwy.net:12345/railway`).

---

### Step 4: Seed the PostgreSQL Database
You can initialize the database tables and pre-populate the 3,290 flat task matrix in one of two ways:

#### Option A: Via Railway Query Tab (Easiest)
1. Open the PostgreSQL service in Railway $\rightarrow$ Click **Data** / **Query** tab.
2. Paste the contents of [`schema.sql`](file:///d:/Construction%20Site%20Manager/schema.sql) and execute.
3. Paste the contents of [`seed.sql`](file:///d:/Construction%20Site%20Manager/seed.sql) and execute.

#### Option B: Via Railway CLI or psql Command
```bash
psql "YOUR_RAILWAY_DATABASE_URL" -f schema.sql
psql "YOUR_RAILWAY_DATABASE_URL" -f seed.sql
```

---

### Step 5: Deploy the Web Application Service
1. In your Railway project canvas, click **+ New** $\rightarrow$ **GitHub Repo**.
2. Select your `constructtrack` repository.
3. Railway will automatically detect Next.js / Node.js and configure the build command (`npm run build`).

---

### Step 6: Configure Environment Variables
In your web application service settings on Railway, navigate to **Variables** $\rightarrow$ click **Add Variable**:

| Variable Name | Value | Purpose |
| :--- | :--- | :--- |
| `DATABASE_URL` | `${{Postgres.DATABASE_URL}}` | Connects Next.js directly to Railway PostgreSQL instance. |
| `NODE_ENV` | `production` | Optimizes Next.js build performance. |
| `NEXT_PUBLIC_APP_URL` | `${{RAILWAY_PUBLIC_DOMAIN}}` | Configures PWA Service Worker domain. |

---

### Step 7: Generate Public Domain & Enable HTTPS
1. Select your Web Service on Railway $\rightarrow$ Navigate to **Settings** $\rightarrow$ **Networking**.
2. Click **Generate Domain** (e.g. `constructtrack-production.up.railway.app`).
3. Railway automatically issues a **free SSL Certificate (`https://`)**.
   > [!IMPORTANT]
   > HTTPS is strictly required by smartphones for Progressive Web Application (PWA) Service Workers and IndexedDB offline background sync to function on site!

---

## 🛡️ Production Health Check
Once deployed, open your Railway URL on a smartphone or desktop:
1. Verify Site/Wing completion rollups load from Railway PostgreSQL.
2. Test Command Palette (`Ctrl+K`) search and 2D Elevator Grid.
3. Disconnect mobile Wi-Fi/Data $\rightarrow$ Log inspection offline $\rightarrow$ Reconnect Wi-Fi $\rightarrow$ Verify IndexedDB background sync flushes updates back to Railway database.
