# Railway & GitHub Deployment Guide - ConstructTrack (v2.5)

This guide walks through pushing your local ConstructTrack codebase to GitHub and connecting it to Railway for 24/7 cloud hosting.

---

## 1. Push Code to GitHub

In your PowerShell / VS Code terminal, run:

```bash
git push -u origin main
```

*(If prompted by Windows Git Credential Manager, sign in to your GitHub account `rsbichukale`).*

---

## 2. Deploy on Railway (3-Step Setup)

1. Open **[Railway.app](https://railway.app)** and log in with your GitHub account.
2. Click **"New Project"** -> Select **"Deploy from GitHub Repo"**.
3. Choose the repository: **`rsbichukale/ConstructTrack`**.

---

## 3. Configure Railway Environment Variables

In your Railway project settings under **Variables**, add the following 2 production environment variables:

| Variable Name | Value |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://iwjowtdhfgjccjzxmdyl.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml3am93dGRoZmdqY2NqenhtZHlsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYzNzcwMTYsImV4cCI6MjEwMTk1MzAxNn0.0yqigqkaxhNixoL1aGAuYmum3c9MIufSaUE9LT-PRI4` |

---

## 4. Generate Live Public URL

1. In Railway project dashboard, click **"Settings"** tab.
2. Scroll to **"Networking"** -> Click **"Generate Domain"**.
3. Railway will give you a live production URL:
   `https://constructtrack-production.up.railway.app`
