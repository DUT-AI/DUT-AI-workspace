# Tasks: Admin Login and Role-Based Access Control (RBAC)

**Input**: Design documents from `/specs/002-admin-login-rbac/`  
**Prerequisites**: [plan.md](file:///Users/nguyenhuynh/Documents/projects/DUT-AI-workspace/specs/002-admin-login-rbac/plan.md), [spec.md](file:///Users/nguyenhuynh/Documents/projects/DUT-AI-workspace/specs/002-admin-login-rbac/spec.md), [research.md](file:///Users/nguyenhuynh/Documents/projects/DUT-AI-workspace/specs/002-admin-login-rbac/research.md), [data-model.md](file:///Users/nguyenhuynh/Documents/projects/DUT-AI-workspace/specs/002-admin-login-rbac/data-model.md), [contracts/](file:///Users/nguyenhuynh/Documents/projects/DUT-AI-workspace/specs/002-admin-login-rbac/contracts)

## Format: `- [ ] [ID] [P?] [Story?] Description with file path`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Which user story this task belongs to (`[US1]`, `[US2]`, `[US3]`, `[US4]`)
- Include exact file paths in all descriptions

---

## Phase 1: Setup (Shared Types & Utilities)

**Purpose**: Create shared data interfaces, validation types, and auth utility functions.

- [X] T001 [P] Create auth type definitions for `AuthCredentials`, `AdminUserProfile`, `AuthApiResponse`, and `AdminSessionState` in `src/types/auth.ts`
- [X] T002 [P] Implement authentication utility functions for role checking (`hasAdminRole`), JWT payload extraction, and cookie header parsing in `src/lib/auth.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core BFF session endpoints and client authentication provider needed by all user stories.

**⚠️ CRITICAL**: Must be completed before implementing specific user story pages.

- [X] T003 Implement session verification route `GET /api/auth/me` proxying to `https://manage.dutai.io.vn/api/v1/auth/me` in `src/app/api/auth/me/route.ts`
- [X] T004 Implement session termination route `POST /api/auth/logout` clearing cookies for `.dutai.io.vn` in `src/app/api/auth/logout/route.ts`
- [X] T005 Implement `AuthProvider` and `useAuth` hook for client-side authentication and role state management in `src/components/auth/AuthProvider.tsx`
- [X] T006 Wrap root application with `AuthProvider` in `src/app/layout.tsx`

**Checkpoint**: Core auth infrastructure ready. User story implementation can now begin.

---

## Phase 3: User Story 1 - Administrator Authentication & Access (Priority: P1) 🎯 MVP

**Goal**: Administrators can log in via `/login` with valid credentials, obtain `.dutai.io.vn` session cookies, and access the protected administrative dashboard (`/admin`).

**Independent Test**: Enter valid admin credentials (`huynhphuocnguyen.dev@gmail.com` / `Nguyen123@`) at `/login`; verify session cookies are set, profile info is retrieved, and browser lands on `/admin`.

- [X] T007 [US1] Implement BFF login route `POST /api/auth/login` proxying to `https://manage.dutai.io.vn/api/v1/auth/login` and forwarding `Set-Cookie` in `src/app/api/auth/login/route.ts`
- [X] T008 [P] [US1] Create `LoginForm` component with email/password validation, loading spinner, and error display in `src/components/auth/LoginForm.tsx`
- [X] T009 [US1] Create `/login` page rendering `LoginForm` with DUT-AI branding in `src/app/login/page.tsx`
- [X] T010 [P] [US1] Create protected Admin layout with header, user profile, and navigation links in `src/app/admin/layout.tsx`
- [X] T011 [US1] Create Admin dashboard landing page displaying ecosystem apps and system quick links in `src/app/admin/page.tsx`

**Checkpoint**: At this point, User Story 1 is fully functional as a Minimum Viable Product (MVP).

---

## Phase 4: User Story 2 - Non-Admin Access Denial & RBAC Enforcement (Priority: P1)

**Goal**: Prevent non-admin users from logging into the workspace or viewing `/admin/*` routes, returning HTTP 403 Forbidden with clear Vietnamese guidance.

**Independent Test**: Attempt login with a non-admin account or directly access `/admin` without admin role; verify HTTP 403 response or redirect to `/login` with access denied error message.

- [X] T012 [US2] Update `src/app/api/auth/login/route.ts` to inspect `role_names` upon successful login and reject non-admin accounts with HTTP 403 and message "Tài khoản của bạn không có quyền truy cập trang quản trị. Chỉ quản trị viên (Admin) mới có quyền truy cập."
- [X] T013 [US2] Update `src/middleware.ts` to guard `/admin/:path*`, inspecting `access_token` cookie and redirecting unauthorized or non-admin visitors to `/login?error=forbidden`
- [X] T014 [US2] Enhance `src/components/auth/LoginForm.tsx` to display localized error banner when `error=forbidden` or a 403 error is returned

**Checkpoint**: User Stories 1 and 2 work together; only genuine administrators can access administrative views.

---

## Phase 5: User Story 3 - SSO Recognition & Auto-Redirect (Priority: P2)

**Goal**: Existing authenticated administrators on `.dutai.io.vn` are automatically recognized when visiting `/login` and forwarded to `/admin`.

**Independent Test**: Open `/login` in a browser session that already has an active admin `access_token` cookie; verify automatic redirect to `/admin` without re-entering credentials.

- [X] T015 [US3] Add automatic session check and redirect in `src/app/login/page.tsx` that navigates to `/admin` (or `?redirect=` target) if already authenticated as admin
- [X] T016 [US3] Add return URL preservation support (`?redirect=...`) across `src/middleware.ts` and `src/components/auth/LoginForm.tsx`

**Checkpoint**: Seamless SSO flow operational between all DUT-AI subdomains.

---

## Phase 6: User Story 4 - Administrator Sign-Out (Priority: P2)

**Goal**: Provide a clean sign-out action from the admin interface and topbar that clears cookies and returns the user to the unauthenticated view.

**Independent Test**: Click "Đăng xuất" in the admin header or profile menu; verify cookies are expired and navigation redirects to `/login`.

- [X] T017 [US4] Add Sign Out button and handler in `src/app/admin/layout.tsx` triggering `POST /api/auth/logout` and redirecting to `/login`
- [X] T018 [US4] Add Admin link / Login link / Sign Out option in `src/components/common/DutAiHeader.tsx` based on user authentication state

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: End-to-end validation, build verification, and clean documentation.

- [X] T019 [P] Execute quickstart validation scenarios from `specs/002-admin-login-rbac/quickstart.md`
- [X] T020 Run `npm run build` in root workspace to verify zero TypeScript errors and successful static/dynamic page generation

---

## Dependencies & Execution Order

### Phase Dependencies
- **Phase 1 (Setup)**: Can start immediately.
- **Phase 2 (Foundational)**: Depends on Phase 1 completion; blocks all subsequent User Stories.
- **Phase 3 (User Story 1 - P1)**: Depends on Phase 2 completion; delivers MVP.
- **Phase 4 (User Story 2 - P1)**: Depends on Phase 3 completion (enhances login endpoint and adds middleware guard).
- **Phase 5 (User Story 3 - P2)**: Depends on Phase 3 and Phase 4.
- **Phase 6 (User Story 4 - P2)**: Depends on Phase 3.
- **Phase 7 (Polish)**: Depends on all user stories being implemented.

### Parallel Opportunities
- `T001` and `T002` can be executed in parallel.
- `T008` (LoginForm) and `T010` (Admin layout) can be created in parallel once `T007` is in progress.
- `T019` and `T020` can run after all implementation tasks are finished.

---

## Implementation Strategy (MVP First)

1. **Step 1: Foundation (Phases 1-2)**: Build `auth.ts`, `types/auth.ts`, `/api/auth/me`, `/api/auth/logout`, `AuthProvider`.
2. **Step 2: MVP Delivery (Phase 3)**: Build `/api/auth/login`, `/login`, `/admin`. Admin can now sign in and see admin dashboard.
3. **Step 3: Security Hardening (Phase 4)**: Add non-admin rejection (403) and middleware route interception.
4. **Step 4: SSO & Sign-out (Phases 5-6)**: Auto-redirect for existing sessions and sign-out buttons.
5. **Step 5: Verification (Phase 7)**: Build and test against `manage.dutai.io.vn`.
