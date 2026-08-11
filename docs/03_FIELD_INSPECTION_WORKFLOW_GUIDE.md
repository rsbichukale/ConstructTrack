# ConstructTrack - Field Inspection & Mobile PWA Navigation Guide

This guide details the mobile-first Progressive Web Application (PWA) navigation tools, step-by-step field inspection workflow, floor plan room mappings, per-task contractor assignment, and offline IndexedDB background sync mechanism.

---

## 📱 Task-Specific Contractor Assignment & End-of-Day Check

ConstructTrack allows Site Engineers and Supervisors to assign trade contractors directly to individual room micro-tasks and filter assigned work at the end of the day:

```
+-----------------------------------------------------------------------------------+
|               ROOM TASK CONTRACTOR ASSIGNMENT & END-OF-DAY FILTER                 |
+------------------------------------+----------------------------------------------+
| 1. Per-Task Contractor Selection   | • Inside any Room Task Inspection Modal,    |
|                                    |   select/change the assigned contractor      |
|                                    |   (e.g., Apex Masonry, Granite Masters).     |
+------------------------------------+----------------------------------------------+
| 2. End-of-Day "Assigned Work Only" | • Filter room tasks with 1 tap:              |
|    Filter Toggle                   |   - [All Room Tasks]                         |
|                                    |   - [Assigned Work Only]                     |
|                                    | • Focus 100% on auditing active contractor   |
|                                    |   assignments at the end of the work day!    |
+------------------------------------+----------------------------------------------+
| 3. Visual Contractor Badges        | • Each room task card prominently displays   |
|                                    |   the assigned Contractor Company Name.      |
+------------------------------------+----------------------------------------------+
```

---

## 1. Step-by-Step Field Inspection Workflow

The app navigation maps directly to physical site inspections:

```
[ STEP 1: SELECT SITE & WING ]  ---> Choose Site 1 or Site 2 & Wing B1 or B2
               │
               ▼
[ STEP 2: SELECT FLOOR ]        ---> Choose Floor 1 to Floor 7 (Live completion %)
               │
               ▼
[ STEP 3: SELECT FLAT / UNIT ]  ---> Choose Flat 101-105 (🟢 Approved, 🟡 In Progress, 🔴 Blocked, ⚪ Not Started)
               │
               ▼
[ STEP 4: FLOOR PLAN ROOM ZONES]---> Interactive layout (Hall, Kitchen, Master Bed, Toilets, Balconies)
               │
               ▼
[ STEP 5: MODAL TASK INSPECTION]---> Assign Contractor -> Update Progress -> Submit & Auto-Close!
```
