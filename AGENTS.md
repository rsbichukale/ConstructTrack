# ConstructTrack Project Rules & Engineering Standards

Apply the following mandatory engineering rules across all development tasks in this workspace:

1. **Zero Hardcoding (Mandatory Rule #1)**:
   - Never use static mock arrays, fallback in-memory lists, or hardcoded dropdown options.
   - All entities (Trades, Rooms, Tasks, Flats, Contractors, Inventory, Materials, Cash, Machinery, Safety, QA Lab, Users) must be 100% database-driven from Local PostgreSQL (`constructtrack_db`).

2. **Zero Hardcoded Database Connections (Mandatory Rule #2)**:
   - Never hardcode connection strings or DB passwords in scripts or source files.
   - Always load dynamically from environment variables (`DATABASE_URL`, `PORT`, `API_URL`).

3. **Update Master Schema After Every Migration**:
   - Always update [`database/schema.sql`](file:///d:/Construction%20Site%20Manager/ConstructTrack/database/schema.sql) after every database migration or schema modification.
   - Keep `schema.sql` as the single consolidated source of truth (100% Pure DDL).

4. **Always Verify Build & Execution**:
   - Always check that Next.js frontend builds cleanly and Express backend endpoints respond with `HTTP 200 OK`.
   - Never complete a task with unverified code or broken syntax.

5. **Continuous Architectural Excellence**:
   - Write scalable, performant code with composite database indexing, SQL views, triggers, and Row Level Security.
