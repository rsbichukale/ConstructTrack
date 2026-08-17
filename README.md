# ConstructTrack Enterprise 🏗️
### Construction Daily Progress, Room Inspection & Contractor Management System
**Local Site Network Hub & Standalone Desktop Application**

---

## 🏛️ System Architecture

ConstructTrack runs as a **Local Site Network Hub & Desktop Application** designed specifically for high-rise construction sites where internet connectivity may be intermittent.

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                   CONSTRUCTTRACK ARCHITECTURE                                    │
├──────────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                                  │
│  [SITE OFFICE HOST PC]                                                                           │
│  ├── 1. 🗄️ Local PostgreSQL Server (Port 5432) ────────── constructtrack_db                      │
│  ├── 2. ⚡ Express API Backend Engine (Port 5000) ─────── Business Logic, CPM, Reports           │
│  ├── 3. 🖥️ Native Desktop Window / PWA Host (Port 3000) ── Dedicated Site Manager UI            │
│  │                                                                                               │
│  │ Local Site Wi-Fi (Works 100% Offline with 0 Cloud Dependencies)                               │
│  ▼                                                                                               │
│  ├── 📱 Site Engineers (Room Inspections, Flat Progress, Defect Photos)                          │
│  ├── 📱 Supervisors (Daily Work Targets & Attendance Muster)                                     │
│  └── 📱 QA Lab Inspectors (Concrete Cube Crushing Tests & Slump Logs)                            │
│                                                                                                  │
└──────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 🚀 Quick Start (1-Click Launch)

### Double-Click Launcher
Double-click **`ConstructTrack-Launcher.bat`** in the project folder.

### Or via Command Line
```bash
npm run start:site
```

The launcher will:
1. Detect your local Wi-Fi / LAN IP address (e.g., `192.168.1.15`).
2. Start the Express API Backend on port `5000`.
3. Start the Next.js Frontend on port `3000` (bound to `0.0.0.0` for LAN access).
4. Launch ConstructTrack in a standalone native desktop window on your PC.
5. Display the network URLs for your team on site:
   - **Host PC (Desktop UI)**: `http://localhost:3000`
   - **Team Devices on Site Wi-Fi**: `http://<YOUR-IP>:3000`

---

## 💾 Local Database Commands

| Command | Description |
| :--- | :--- |
| `npm run db:init` | Initializes all 29 database tables, views, and indexes in `constructtrack_db`. |
| `npm run db:seed` | Seeds the full project dataset (70 flats, 6,832 micro-tasks, materials, machinery). |
| `npm run db:backup` | Takes a 1-click snapshot `.sql` dump into `database/backups/`. |
| `npm run test:reports` | Validates all 8 enterprise reporting endpoints against the local database. |

---

## 📊 8 Enterprise Site Reporting Modules

1. **Daily Operational Field Report (DPR)**: Headcount, manpower muster, daily work targets, plant running hours, and fuel consumption.
2. **Concrete Cube QA & Lab Register**: 7-day and 28-day compressive strength compliance, slump variance, and supplier pass rates.
3. **Snagging & Quality Defect Audit**: Defect punch list, SLA turnaround times, and before/after photo resolution audit.
4. **Material Store & Consumption Ledger**: Inward receipts, outward floor issues, buffer thresholds, and contractor debit notes.
5. **Contractor SLA & Performance Scorecard**: Target adherence percentage, manpower deployed vs required, and productivity metrics.
6. **Site Imprest & Petty Cash Register**: Daily cash-in vouchers, expense breakdowns, and safe balance audits.
7. **Client Variations & Commercial Margin Tracker**: 3-tier margin ledger (Client Quoted vs Contractor Cost vs Developer Profit).
8. **Tower Execution & Possession Matrix**: 2D elevation heatmap, wing progress, and possession readiness status.

---

## 🛠️ Tech Stack

- **Frontend**: Next.js 16 (Turbopack), React 19, Tailwind CSS, Lucide Icons, IndexedDB Cache
- **Backend**: Node.js, Express 5, Compression, Helmet, Rate Limiting, Local JWT Auth
- **Database**: Local PostgreSQL Server (`constructtrack_db`) on Port 5432
- **Exports**: ExcelJS (5-sheet `.xlsx` master workbooks), jsPDF / html2canvas (Inspection Dossiers)
