# ConstructTrack - Technical Implementation Roadmap

This document outlines the 4-phase technical implementation strategy for ConstructTrack.

---

## 1. 4-Phase Execution Roadmap

```
+-----------------------------------------------------------------------------------+
|                        Phase 1: DB Seeding & Data Engine                          |
|  • PostgreSQL Schema DDL & JavaScript Seed Engine (70 Flats, 3,290 Task Matrix)   |
|  • REST APIs & High-Performance State Manager                                     |
+-----------------------------------------------------------------------------------+
                                         │
                                         ▼
+-----------------------------------------------------------------------------------+
|                   Phase 2: Mobile PWA & Step Navigation Engine                    |
|  • Step Navigator (Site ──► Floor ──► Flat ──► Floor Plan Room Zone)             |
|  • Room Inspector UI (Status toggle, 0-100% completion slider, Photo proof)      |
|  • Elevator Grid Matrix, Command Palette (Ctrl+K), & Bulk EOD Floor Logger       |
|  • Service Worker & IndexedDB Offline Sync ('sync-site-logs')                    |
+-----------------------------------------------------------------------------------+
                                         │
                                         ▼
+-----------------------------------------------------------------------------------+
|                Phase 3: Contractor Portal & Resource Management                   |
|  • Contractor Priority Queue UI (HIGH / MEDIUM / LOW)                             |
|  • Smartphone photo proof submission engine                                       |
|  • Daily Labor Headcount Muster Roll (Masons + Helpers tracking)                  |
+-----------------------------------------------------------------------------------+
                                         │
                                         ▼
+-----------------------------------------------------------------------------------+
|              Phase 4: Trade Dependencies, Analytics & RA Billing                  |
|  • Trade Dependency locking rules & blocker delay alert banners                  |
|  • Floorwise & Flatwise Executive Progress Analytics Dashboards                   |
|  • Automated Contractor Running Account (RA) Billing Generator                    |
+-----------------------------------------------------------------------------------+
```

---

## 2. Frontend Component Architecture

| Component File | Role & Responsibility |
| :--- | :--- |
| `src/types/index.ts` | Complete TypeScript models for Sites, Flats, Room Zones, Tasks, Logs, Muster Roll, and RA Invoices. |
| `src/lib/seedEngine.ts` | Data initialization script pre-populating 70 flats and 3,290 flat task matrix instances. |
| `src/lib/db.ts` | High-performance reactive state engine with local storage persistence and IndexedDB sync. |
| `src/components/StepNavigator.tsx` | Breadcrumb & visual step switcher (`Site` $\rightarrow$ `Floor` $\rightarrow$ `Flat` $\rightarrow$ `Room Zone`). |
| `src/components/FloorSelector.tsx` | Floor selection grid (Floors 1 to 7) with progress badges. |
| `src/components/FlatSelector.tsx` | Flat selection grid (`101`–`105`) with color status badges (🟢, 🟡, 🔴, ⚪). |
| `src/components/FloorPlanZones.tsx` | Interactive architectural diagram mapping the 8-9 room zones. |
| `src/components/RoomInspector.tsx` | Micro-task inspection UI with status toggles, completion slider, photo upload, and report sign-off. |
| `src/components/ElevatorGrid.tsx` | 2D visual matrix overview mapping all 7 floors vs 5 flats. |
| `src/components/CommandPalette.tsx` | Instant search modal (`Ctrl+K`) for fast flat jumps. |
| `src/components/BulkFloorLogger.tsx` | 10-second multi-flat floor progress entry tool. |
| `src/components/ContractorPortal.tsx` | Priority queue, daily labor muster roll, and blocker delay logger. |
| `src/components/RABilling.tsx` | Automated contractor Running Account billing invoice generator. |
