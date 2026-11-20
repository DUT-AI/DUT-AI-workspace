# Implementation Plan: Ecosystem Application CRUD Management

**Branch**: `003-app-crud-management` | **Date**: 2026-11-20 | **Spec**: [spec.md](file:///Users/nguyenhuynh/Documents/projects/DUT-AI-workspace/specs/003-app-crud-management/spec.md)

**Input**: Feature specification from `/specs/003-app-crud-management/spec.md`

## Summary

Implement a full CRUD (Create, Read, Update, Delete) management system for ecosystem applications and websites on DUT-AI Workspace:
1. **Persistent Storage Engine (`src/lib/app-storage.ts`)**:
   - Manages `data/apps.json` with thread-safe / atomic reads and writes.
   - Automatically seeds with the initial 4 core applications (`manage`, `lms`, `meetly`, `data`) on first start.
2. **RESTful Registry Endpoints**:
   - `GET /api/v1/apps`: Returns active apps (or all apps when queried with `?all=true` by an authenticated admin).
   - `POST /api/v1/apps`: Admin only. Creates a new application.
   - `PUT /api/v1/apps/[id]`: Admin only. Updates an existing application.
   - `DELETE /api/v1/apps/[id]`: Admin only. Removes an application.
   - `PATCH /api/v1/apps/[id]/toggle`: Admin only. Fast one-click toggle for active status.
3. **Admin CRUD User Interface (`/admin/apps`)**:
   - Search, filter, and view all registered ecosystem apps.
   - Add Application Modal (`AppFormModal`) with form validation.
   - Edit Application Modal with prefilled values.
   - Delete Confirmation Dialog (`DeleteConfirmModal`).
   - One-click active/inactive toggle switch.
4. **Real-time Sync**:
   - Portal Hub (`/`) and Waffle Menu (`waffle.js`) automatically reflect changes made in `/admin/apps`.

## Technical Context

**Language/Version**: TypeScript 5.6 / Next.js 14.2 (App Router)

**Primary Dependencies**:
- Frontend: React 18, Tailwind CSS, Lucide React (`lucide-react`)
- Backend/Storage: Node.js `fs/promises`, `path` for durable atomic JSON file persistence

**Storage**:
- Local persistent JSON file: `data/apps.json`
- In-memory cache for ultra-fast response (< 1ms)

**Testing**:
- cURL verification scenarios in [quickstart.md](file:///Users/nguyenhuynh/Documents/projects/DUT-AI-workspace/specs/003-app-crud-management/quickstart.md)
- Build verification via `npm run build`

**Target Platform**: Node.js / Linux VPS / Docker container

**Performance Goals**:
- Read latency: < 1ms
- Write latency: < 10ms
- Immediate propagation to Portal Hub and Waffle Menu without server restart

**Constraints**:
- Mutating operations (`POST`, `PUT`, `DELETE`, `PATCH`) must strictly require Admin role (`admin`).
- Unauthenticated or public callers can only retrieve active applications.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Zero Iframe & Native Web DOM**: PASS. Pure native Next.js interface with clean modal and responsive grid/table.
- **Role-Based Security**: PASS. Only administrators can perform mutating operations.
- **Simplicity & Zero Dependency Overhead**: PASS. Uses local atomic JSON persistence, avoiding bulky database servers for a lightweight catalog.

## Project Structure

### Documentation (this feature)

```text
specs/003-app-crud-management/
├── spec.md              # Feature Specification (CRUD operations, RBAC requirements)
├── plan.md              # Implementation Plan (/speckit-plan output)
├── research.md          # Phase 0 Research (Storage choice, API design, UI layout)
├── data-model.md        # Phase 1 Data Model (AppRegistryItem, CreateAppDto, UpdateAppDto)
├── quickstart.md        # Phase 1 End-to-End Validation Guide
├── contracts/           # Phase 1 JSON Schemas
│   ├── app-create-request.json
│   ├── app-update-request.json
│   └── apps-list-response.json
└── checklists/          # Feature Quality Checklists
    └── requirements.md
```

### Source Code (repository structure)

```text
data/
└── apps.json                   # Durable storage for ecosystem applications

src/
├── app/
│   ├── api/
│   │   └── v1/
│   │       └── apps/
│   │           ├── route.ts            # GET /api/v1/apps, POST /api/v1/apps
│   │           └── [id]/
│   │               ├── route.ts        # PUT, DELETE /api/v1/apps/[id]
│   │               └── toggle/
│   │                   └── route.ts    # PATCH /api/v1/apps/[id]/toggle
│   ├── admin/
│   │   ├── page.tsx                    # Updated to link to /admin/apps
│   │   └── apps/
│   │       └── page.tsx                # App CRUD Management dashboard page
│   └── page.tsx                        # Dynamic Portal Hub reading from storage
├── components/
│   └── admin/
│       ├── AppManagementClient.tsx     # Client controller for apps table & search
│       ├── AppFormModal.tsx            # Modal for adding & editing an application
│       └── DeleteConfirmModal.tsx      # Modal for confirming deletion
├── lib/
│   ├── app-storage.ts                  # Atomic read/write storage engine for data/apps.json
│   └── auth.ts                         # Added requireAdmin() helper for API routes
└── types/
    └── sso.ts                          # AppRegistryItem, CreateAppDto, UpdateAppDto
```

## Complexity Tracking

> No external database or heavy dependency added. Follows minimalist, resilient architecture with file-backed storage and native Next.js API Route Handlers.
