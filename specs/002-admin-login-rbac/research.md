# Research: Admin Login and Role-Based Access Control (RBAC)

**Feature**: `002-admin-login-rbac` | **Spec**: [spec.md](file:///Users/nguyenhuynh/Documents/projects/DUT-AI-workspace/specs/002-admin-login-rbac/spec.md)

## Unknowns & Clarifications Resolved

### 1. Authentication Integration Strategy (Direct Browser Fetch vs Next.js Route Handler BFF)

- **Context**: The client needs to submit credentials (`email`, `password`) to `https://manage.dutai.io.vn/api/v1/auth/login` and have `access_token` and `refresh_token` cookies set for `.dutai.io.vn`.
- **Decision**: Implement a Next.js API Route Handler (`/api/auth/login`) acting as a Backend-For-Frontend (BFF) proxy, while also allowing client-side direct fetch fallback.
- **Rationale**:
  - A Next.js API route forwarder eliminates potential browser CORS restrictions.
  - It allows intercepting the `Set-Cookie` headers from `manage.dutai.io.vn` and ensuring they are forwarded cleanly to the browser with `Domain=.dutai.io.vn; Path=/; HttpOnly; SameSite=Lax; Secure`.
  - It allows immediate verification of whether the authenticating user possesses the `admin` role before issuing the final login response to the frontend client. If the user is authenticated but not an admin, the BFF can refuse the login with a 403 status code and avoid creating an admin session state.
- **Alternatives Considered**:
  - *Direct browser fetch*: Works if CORS headers permit, but error messages may be exposed or subject to browser cookie policy differences across origins. BFF provides tighter control and cleaner security boundary.

---

### 2. Role Verification & RBAC Enforcement Flow

- **Context**: User explicitly specified:
  - `POST https://manage.dutai.io.vn/api/v1/auth/login`
  - `GET https://manage.dutai.io.vn/api/v1/auth/me` with cookie
  - Response from `/me` contains `data.role_names`: `["admin", "Trainer"]`.
- **Decision**: Multi-layer RBAC verification:
  1. **Login-time Check**: When `/api/auth/login` receives a 200 OK from `manage.dutai.io.vn`, it immediately inspects `roles` or calls `/api/v1/auth/me`. If `"admin"` (case-insensitive) is not found in `role_names`, it returns `403 Forbidden` with `"Tài khoản không có quyền truy cập trang quản trị. Chỉ quản trị viên (Admin) mới có quyền truy cập."`
  2. **Edge / Middleware Check**: `src/middleware.ts` intercepts all requests to `/admin/:path*`.
     - If `access_token` cookie is absent, redirects to `/login?redirect=/admin`.
     - Decodes JWT payload (which contains `"roles": [...]`). If `admin` is not in roles, redirects to `/unauthorized` or `/login?error=forbidden`.
  3. **Server Component & Client Hydration Check**: `GET /api/auth/me` proxies to `https://manage.dutai.io.vn/api/v1/auth/me` forwarding the cookie, validating session freshness with the central database and hydrating user profile info (name, email, avatar).
- **Rationale**: Defense in depth. Fast middleware checks avoid unnecessary network calls, while `/me` verification guarantees up-to-date role status without stale tokens.
- **Alternatives Considered**:
  - *Client-only check*: Unsafe; unprotected HTML could flash or be reached by simply navigating client routes.

---

### 3. Session Persistence & Auto-Redirect Handling

- **Context**: When an administrator who already logged in at `manage.dutai.io.vn` or `workspace.dutai.io.vn` visits `/login`, they should not be forced to log in again.
- **Decision**:
  - The `/login` page and Next.js middleware check for existing `access_token`.
  - If present and valid admin, automatically redirect to `/admin`.
  - If present but non-admin, redirect to public portal `/` or show notice.
  - If invalid or expired, allow rendering the login form.
- **Rationale**: Provides smooth Google Workspace-like single sign-on experience.

---

### 4. Admin Navigation & Workspace Layout

- **Context**: Workspace requires a dedicated admin interface accessible only to admins.
- **Decision**:
  - Create route `/admin` (and subpaths e.g. `/admin/apps`) with an administrative layout:
    - Sidebar or Topbar with Admin badge.
    - User avatar and name from `/api/v1/auth/me`.
    - Sign out action calling `/api/auth/logout` (clearing `access_token` and `refresh_token` cookies for `.dutai.io.vn`).
    - Quick links to manage apps in the ecosystem, view app registry, and launch applications.
- **Rationale**: Clear distinction between public portal launcher (`/`) and administrative control plane (`/admin`).
