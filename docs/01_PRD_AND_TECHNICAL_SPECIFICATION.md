# ConstructTrack - Master PRD & Technical Specification

**Project Name:** Construction Site Daily Progress, Resource & Contractor Management System (`ConstructTrack`)  
**Document Version:** 4.0 (Site Executive Reports & Analytics Center Added)  
**Target Platform:** Mobile-First Progressive Web Application (PWA) & Desktop Web Admin Dashboard  

---

## 1. Executive Summary & Vision

ConstructTrack includes a dedicated **Site Executive Reports & Analytics Center** covering the 4 vital reports requested for site engineers and developers:

1. **👷 Labor Attendance Report (All Workers Registry & Muster Roll):**
   * Detailed breakdown of Masons, Helpers, and Lead Workers across all trade contractors.
   * Individual registered worker registry with skill levels, Gov ID numbers, and daily wage rates.
2. **📸 Daily Work Progress Report (With Inspection Photo Proof & Remarks):**
   * Live field inspection logs with high-resolution photo proof thumbnails.
   * Inspector remarks, flat unit, room zone, and trade classification.
3. **🧱 Pending Work Report For All Floors (Wing B1 & B2 Audit):**
   * Floor-by-floor breakdown of completion % across Floors 1 to 7.
   * Task status counts: Approved, In Progress, Rework/Blocked, and Not Started per floor.
4. **🔑 Ready to Possession & Client Handover Certificate Report:**
   * **100% Possession Ready Flats**: Certified units with zero pending items ready for key handover.
   * **Near Completion Flats (90%+ Ready)**: Units missing only 1 or 2 minor finishing items.

---

## 2. Target User Personas & Permissions (RBAC)

| Role | Operational Scope | Access Scope | Key App Capabilities |
| :--- | :--- | :--- | :--- |
| **Project Manager / Admin** | Full Site Oversight & Speed Acceleration | Read & Write (All Sites) | 4 Executive Site Reports (Attendance, Photo Progress, Floor Pending, Ready to Possession), PDF & WhatsApp exports, morning daily target assignment, End-of-Day audit sign-offs, configure Wing B1/B2/Both Wing contractors, add/suspend/delete trade contractors, sidebar menu navigation, Resource Allocation Center, critical path trade bottleneck matrix, master setup, micro-tasks catalog manager, execution priority order, client customization logger, contractor directory, task assignment engine, laborer database registry, daily labor muster roll & progress reports, WhatsApp report sharing, RA billing approvals. |
| **Site Supervisor / Engineer** | Physical Field Verification | Read & Write (Assigned Site/Wing) | End-of-day target verification audit, step-by-step site/floor/flat/room inspection, room task verification, photo proof attachment, defect/rework flagging, daily attendance entry, offline sync. |
| **Trade Contractor** | Work Execution & Labor Deployment | Restricted (Assigned Tasks & Own Laborers) | Daily work target queue view, daily labor headcount logging (muster roll), completion requests with photo uploads, rework tracker. |
