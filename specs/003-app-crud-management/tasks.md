# Tasks: Ecosystem Application CRUD Management

**Input**: Design documents from `/specs/003-app-crud-management/`  
**Prerequisites**: [plan.md](file:///Users/nguyenhuynh/Documents/projects/DUT-AI-workspace/specs/003-app-crud-management/plan.md), [spec.md](file:///Users/nguyenhuynh/Documents/projects/DUT-AI-workspace/specs/003-app-crud-management/spec.md), [research.md](file:///Users/nguyenhuynh/Documents/projects/DUT-AI-workspace/specs/003-app-crud-management/research.md), [data-model.md](file:///Users/nguyenhuynh/Documents/projects/DUT-AI-workspace/specs/003-app-crud-management/data-model.md), [contracts/](file:///Users/nguyenhuynh/Documents/projects/DUT-AI-workspace/specs/003-app-crud-management/contracts)

## Format: `- [ ] [ID] [P?] [Story?] Description with file path`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Which user story this task belongs to (`[US1]`, `[US2]`, `[US3]`, `[US4]`)
- Include exact file paths in all descriptions

---

## Phase 1: Setup (Data Types & Storage File)

**Purpose**: Establish data interfaces and initial persistent seed storage.

- [X] T001 [P] Add `CreateAppDto` and `UpdateAppDto` interface definitions in `src/types/sso.ts`
- [X] T002 [P] Create initial seed JSON storage file in `data/apps.json` with the 4 default ecosystem applications (`manage`, `lms`, `meetly`, `data`)

---

## Phase 2: Foundational (Storage Engine & RBAC API Guard)

**Purpose**: Core storage operations and admin authorization guard required by all user stories.

**⚠️ CRITICAL**: Must be completed before implementing specific user story endpoints and UI views.

- [X] T003 Implement atomic file read/write storage engine with fallback seeding in `src/lib/app-storage.ts`
- [X] T004 Implement `requireAdmin` authorization helper for Next.js Route Handlers in `src/lib/auth.ts`

**Checkpoint**: Foundation ready - application storage and API security guard ready for user story implementation.

---

## Phase 3: User Story 1 - View and List Ecosystem Applications (Priority: P1) 🎯 MVP

**Goal**: Administrators can view the complete list of ecosystem applications (active and inactive) on `/admin/apps`, while general users access only active apps.

**Independent Test**: Load `GET /api/v1/apps` to view active apps, and navigate to `/admin/apps` to view all applications with status badges and details.

- [X] T005 [US1] Update `GET /api/v1/apps` route handler in `src/app/api/v1/apps/route.ts` to read dynamically from `src/lib/app-storage.ts` and support `?all=true` for admin callers
- [X] T006 [P] [US1] Create `AppList` component displaying applications in a responsive card/table layout with status badges, icons, and URLs in `src/components/admin/AppList.tsx`
- [X] T007 [US1] Create Application Management page in `src/app/admin/apps/page.tsx` integrating `AppList`
- [X] T008 [US1] Add navigation link to `/admin/apps` in `src/app/admin/layout.tsx` and quick manage button in `src/app/admin/page.tsx`

**Checkpoint**: At this point, User Story 1 is fully functional as a Minimum Viable Product (MVP).

---

## Phase 4: User Story 2 - Register a New Ecosystem Application (Priority: P1)

**Goal**: Administrators can add a new website or service to the ecosystem through a modal form, validating inputs and persisting to storage.

**Independent Test**: Open `/admin/apps`, click "Thêm ứng dụng mới", fill in required fields (`id`, `title`, `url`, `icon`), submit, and verify the new app appears in the list and in `GET /api/v1/apps`.

- [X] T009 [US2] Implement `POST /api/v1/apps` route handler with input validation (`id`, `title`, `url`) and `requireAdmin` enforcement in `src/app/api/v1/apps/route.ts`
- [X] T010 [P] [US2] Create `AppFormModal` component with field validation, icon picker, and accent color selector in `src/components/admin/AppFormModal.tsx`
- [X] T011 [US2] Integrate `AppFormModal` creation flow into `src/app/admin/apps/page.tsx` with success and error toast notifications

**Checkpoint**: User Stories 1 and 2 work together; new apps can be registered dynamically.

---

## Phase 5: User Story 3 - Edit Application Metadata & Display Status (Priority: P1)

**Goal**: Administrators can edit existing application metadata and toggle visibility (active vs. inactive) with immediate propagation.

**Independent Test**: Click "Chỉnh sửa" on an app to modify its title or description; toggle the active switch to disable the app; verify the change is saved and hidden from public `GET /api/v1/apps`.

- [X] T012 [US3] Implement `PUT /api/v1/apps/[id]/route.ts` route handler for full metadata updates with `requireAdmin` check in `src/app/api/v1/apps/[id]/route.ts`
- [X] T013 [P] [US3] Implement `PATCH /api/v1/apps/[id]/toggle/route.ts` route handler for 1-click active/inactive status toggle in `src/app/api/v1/apps/[id]/toggle/route.ts`
- [X] T014 [US3] Connect edit action in `src/components/admin/AppList.tsx` to open `AppFormModal` in edit mode and connect toggle switch to trigger `PATCH /api/v1/apps/[id]/toggle`

**Checkpoint**: User Stories 1, 2, and 3 work together; existing applications can be updated or toggled.

---

## Phase 6: User Story 4 - Remove an Application from the Ecosystem (Priority: P2)

**Goal**: Administrators can permanently delete an application after confirming a safety confirmation prompt.

**Independent Test**: Click "Xóa" on an app in `/admin/apps`, confirm in `DeleteConfirmModal`, and verify the app is removed from storage and disappears from all lists.

- [X] T015 [US4] Implement `DELETE /api/v1/apps/[id]/route.ts` route handler with `requireAdmin` check in `src/app/api/v1/apps/[id]/route.ts`
- [X] T016 [P] [US4] Create `DeleteConfirmModal` component displaying app title and confirmation warning in `src/components/admin/DeleteConfirmModal.tsx`
- [X] T017 [US4] Integrate deletion confirmation dialog into `src/app/admin/apps/page.tsx` and refresh app list upon deletion

**Checkpoint**: Complete CRUD cycle functional across all 4 user stories.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Synchronization with public hub, end-to-end validation, and build verification.

- [X] T018 Update Portal Hub landing page in `src/app/page.tsx` to read dynamic active applications from `src/lib/app-storage.ts`
- [X] T019 [P] Execute quickstart validation scenarios from `specs/003-app-crud-management/quickstart.md`
- [X] T020 Run `npm run build` in root workspace to verify zero TypeScript errors and successful production build

---

## Dependencies & Execution Order

### Phase Dependencies
- **Phase 1 (Setup)**: Can start immediately.
- **Phase 2 (Foundational)**: Depends on Phase 1 completion; blocks all subsequent User Stories.
- **Phase 3 (User Story 1 - P1)**: Depends on Phase 2; delivers MVP listing view.
- **Phase 4 (User Story 2 - P1)**: Depends on Phase 3.
- **Phase 5 (User Story 3 - P1)**: Depends on Phase 4 (reuses `AppFormModal`).
- **Phase 6 (User Story 4 - P2)**: Depends on Phase 3.
- **Phase 7 (Polish)**: Depends on all user stories being complete.

### Parallel Opportunities
- `T001` and `T002` can run in parallel.
- `T003` and `T004` can run in parallel.
- `T006` and `T010` and `T016` (UI modals/components) can be developed in parallel once foundational storage is ready.
- `T019` and `T020` run during final validation.

---

## Implementation Strategy (MVP First)

1. **Step 1: Storage & Core Foundation (Phases 1-2)**: Build `src/lib/app-storage.ts`, `data/apps.json`, `requireAdmin`.
2. **Step 2: MVP Delivery (Phase 3)**: Connect dynamic `GET /api/v1/apps`, build `/admin/apps` and `AppList.tsx`.
3. **Step 3: Registration & Editing (Phases 4-5)**: Implement `POST`, `PUT`, `PATCH toggle`, `AppFormModal.tsx`.
4. **Step 4: Deletion & Confirmation (Phase 6)**: Implement `DELETE`, `DeleteConfirmModal.tsx`.
5. **Step 5: Portal Sync & Verification (Phase 7)**: Sync `/` Portal Hub with dynamic storage, run `quickstart.md` and `npm run build`.
