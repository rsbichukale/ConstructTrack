# ConstructTrack - Workflow Improvement & Automation Blueprint

This blueprint outlines high-impact workflow enhancements to make field data collection faster, automate communication between trade contractors, and generate client-ready inspection certificates.

---

## 🚀 Recommended Workflow Enhancements

### 1. Voice-to-Text Audio Dictation for Inspectors
* **Field Friction**: Engineers wearing work gloves or handling tools find typing text on mobile keyboards slow and difficult on dusty job sites.
* **Solution**: Add a speech-to-text mic button (`Web Speech API`) on the `RoomInspector` notes input.
* **Workflow**: Tap mic icon $\rightarrow$ Dictate observation (*"Kitchen sink pipe fitting loose, rework requested"*) $\rightarrow$ Text auto-populates in inspector notes.

---

### 2. High-Speed One-Tap Batch Operations
* **Field Friction**: Inspecting standard 100% completed rooms requires clicking through each micro-task individually.
* **Solution**: 
  * **"Approve All Room Micro-Tasks"**: One tap inside `RoomInspector.tsx` signs off all tasks in that room at 100% `APPROVED`.
  * **"Flag Entire Flat Blocked"**: Quick action menu on Flat cards to flag an entire flat (e.g. key locked or safety hazard).

---

### 3. Automated WhatsApp & SMS Blocker Notifications
* **Field Friction**: Contractors don't check the web portal constantly, leading to delays when work is flagged for rework or unlocked.
* **Solution**: Integrate WhatsApp Business API / Twilio SMS webhooks.
* **Workflow**:
  1. Supervisor marks task as `REWORK` or flags blocker $\rightarrow$ Auto WhatsApp sent to contractor phone number (`contractors.phone`).
  2. Sequential trade prerequisite task marked `APPROVED` $\rightarrow$ Auto WhatsApp sent to downstream contractor (*"Kitchen Plumbing Approved! Tiling can begin in Flat 301"*).

---

### 4. Client-Ready PDF Inspection Certificates
* **Field Friction**: Handover to flat buyers or management requires formal documented proof of quality sign-offs.
* **Solution**: Client-side PDF generator (`html2pdf` / `jsPDF`).
* **Output**: Branded **"Flat Completion & Quality Certificate"** displaying room-by-room completion percentages, inspector sign-off signatures, and timestamped photo proofs.

---

### 5. Automated Smartphone Photo Compression
* **Field Friction**: High-resolution smartphone photos (5MB to 12MB each) drain mobile data and slow down sync on 3G site networks.
* **Solution**: Client-side Canvas photo compressor (`browser-image-resizer`).
* **Result**: Compresses 10MB photos to ~150KB WebP images in $<0.5$ seconds before saving to IndexedDB / AWS S3.

---

### 6. Pinned Inspection Shortcuts Bar (Now Live)
* **Feature**: Quick-access bar on the supervisor dashboard displaying active inspection flats (e.g., `B1-101`, `B1-102`, `B1-201`).
* **Impact**: Saves 3 drilldown steps per inspection.
