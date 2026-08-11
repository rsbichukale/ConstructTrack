# ConstructTrack - Construction Site Daily Progress, Resource & Contractor Management System

**ConstructTrack** is a mobile-first Progressive Web Application (PWA) and Desktop Web Admin Dashboard designed to transform fragmented Excel spreadsheet tracking (`WORK UPDATE.xlsx`) into a real-time construction management operating system.

---

## 📚 Project Documentation (`/docs`)

All project documentation, specs, database schemas, and guides are organized inside the [`/docs`](file:///d:/Construction%20Site%20Manager/docs) folder:

1. [01. Master PRD & Technical Specification](file:///d:/Construction%20Site%20Manager/docs/01_PRD_AND_TECHNICAL_SPECIFICATION.md)
   * Product vision, problem statement, RBAC permissions, 3,290 matrix task scale, and core modules.

2. [02. Database & Data Seeding Guide](file:///d:/Construction%20Site%20Manager/docs/02_DATABASE_AND_SEEDING_GUIDE.md)
   * PostgreSQL production DDL (`schema.sql`), entity relationships, and SQL database seeding script (`seed.sql`).

3. [03. Field Inspection & Navigation Guide](file:///d:/Construction%20Site%20Manager/docs/03_FIELD_INSPECTION_WORKFLOW_GUIDE.md)
   * Step-by-step drilldown workflow (**Site $\rightarrow$ Floor $\rightarrow$ Flat $\rightarrow$ Floor Plan Room Zone $\rightarrow$ Room Inspection & Manual Report Sign-off**), Command Palette (`Ctrl+K`), 2D Elevator Grid, and IndexedDB offline PWA sync.

4. [04. Technical Implementation Roadmap](file:///d:/Construction%20Site%20Manager/docs/04_IMPLEMENTATION_ROADMAP.md)
   * Component architecture breakdown and 4-phase execution roadmap.

5. [05. Railway Production Deployment Guide](file:///d:/Construction%20Site%20Manager/docs/05_RAILWAY_DEPLOYMENT_GUIDE.md)
   * Hosting blueprint for deploying Web PWA + PostgreSQL Database on Railway (`railway.app`).

6. [06. Workflow Improvement Blueprint](file:///d:/Construction%20Site%20Manager/docs/06_WORKFLOW_IMPROVEMENT_RECOMMENDATIONS.md)
   * High-impact workflow automations: Voice-to-Text dictation, WhatsApp notifications, PDF handover certificates, and image compression.

---

## 🛠️ Quick Reference Artifacts

* Database Schema: [schema.sql](file:///d:/Construction%20Site%20Manager/schema.sql)
* Database Seed Script: [seed.sql](file:///d:/Construction%20Site%20Manager/seed.sql)
* Offline PWA Sync Service: [dbSyncService.js](file:///d:/Construction%20Site%20Manager/dbSyncService.js)
