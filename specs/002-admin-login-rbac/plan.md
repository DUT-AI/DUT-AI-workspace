# Implementation Plan: Admin Login and Role-Based Access Control (RBAC)

**Branch**: `002-admin-login-rbac` | **Date**: 2026-11-20 | **Spec**: [spec.md](file:///Users/nguyenhuynh/Documents/projects/DUT-AI-workspace/specs/002-admin-login-rbac/spec.md)

**Input**: Feature specification from `/specs/002-admin-login-rbac/spec.md`

## Summary

Implement a dedicated administrative authentication portal and strict Role-Based Access Control (RBAC) guard for `DUT-AI-workspace` (`workspace.dutai.io.vn`):
1. **Admin Login Interface (`/login`)**: Google Workspace-styled login page with form validation, loading states, and error handling.
2. **Backend-For-Frontend (BFF) Auth Endpoints**:
   - `POST /api/auth/login` proxies credentials to `https://manage.dutai.io.vn/api/v1/auth/login`, forwards `.dutai.io.vn` SSO cookies, and validates admin role.
   - `GET /api/auth/me` proxies to `https://manage.dutai.io.vn/api/v1/auth/me` using incoming cookies to verify session freshness and role claims.
   - `POST /api/auth/logout` invalidates SSO cookies across `.dutai.io.vn`.
3. **Role-Based Access Control (RBAC)**: Enforces that only users with role `"admin"` (case-insensitive) in `role_names` can enter `/admin/*`. Non-admins are blocked with HTTP 403 and a clear message.
4. **Middleware Protection**: `src/middleware.ts` intercepts `/admin/*` routes, redirecting unauthenticated or unauthorized visitors to `/login`.
5. **Admin Workspace Dashboard (`/admin`)**: Administrative dashboard displaying the administrator's profile (name, email, avatar), system app status, and administrative navigation.

## Technical Context

**Language/Version**: TypeScript 5.6 / Next.js 14.2 (App Router)

**Primary Dependencies**:
- Frontend: React 18, Tailwind CSS, Lucide React (`lucide-react`)
- HTTP / Edge: Next.js Request / Response API, `cookies()` from `next/headers`

**Storage**:
- HTTP-Only Cookies: `access_token`, `refresh_token` (`Domain=.dutai.io.vn; Path=/; SameSite=Lax; Secure; HttpOnly`)
- Client State: React Context (`AuthContext` / `useAuth`) for user profile hydration and role status

**Testing**:
- Manual & Curl validation scenarios documented in [quickstart.md](file:///Users/nguyenhuynh/Documents/projects/DUT-AI-workspace/specs/002-admin-login-rbac/quickstart.md)
- Build verification via `npm run build`

**Target Platform**: Node.js / Vercel / Cloudflare VPS deployment

**Project Type**: Web Application (Next.js App Router)

**Performance Goals**:
- Login API proxy roundtrip: < 1.5s
- Session verification `/api/auth/me`: < 500ms
- Middleware edge guard latency: < 5ms

**Constraints**:
- Must integrate directly with existing IdP `https://manage.dutai.io.vn` without modifying Manage backend code.
- Must support cross-subdomain SSO cookies on `.dutai.io.vn`.
- Only users with `"admin"` in `role_names` are authorized for `/admin/*`.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Zero Iframe & Native Web DOM**: PASS. `/login` and `/admin` are 100% native Next.js pages.
- **SSO Security & RBAC Enforcement**: PASS. Uses central IdP `manage.dutai.io.vn` with strict role checking on both server and client.
- **Simplicity & No Overhead**: PASS. Lightweight Next.js Route Handlers without external auth libraries or heavy database dependencies.

## Project Structure

### Documentation (this feature)

```text
specs/002-admin-login-rbac/
├── spec.md              # Feature Specification (Admin Login, RBAC, API requirements)
├── plan.md              # Implementation Plan (/speckit-plan output)
├── research.md          # Phase 0 Research (BFF proxy strategy, RBAC flow, Session persistence)
├── data-model.md        # Phase 1 Data Model (AuthCredentials, AdminUserProfile, SessionState)
├── quickstart.md        # Phase 1 End-to-End Validation Guide
├── contracts/           # Phase 1 JSON Schemas
│   ├── login-request.json
│   ├── login-response.json
│   └── me-response.json
└── checklists/          # Feature Quality Checklists
    └── requirements.md
```

### Source Code (repository structure)

```text
src/
├── app/
│   ├── api/
│   │   ├── auth/
│   │   │   ├── login/route.ts      # BFF POST /api/auth/login -> manage.dutai.io.vn
│   │   │   ├── me/route.ts         # BFF GET /api/auth/me -> manage.dutai.io.vn
│   │   │   └── logout/route.ts     # POST /api/auth/logout -> clear cookies
│   │   └── v1/apps/route.ts        # App Registry API
│   ├── login/
│   │   └── page.tsx                # Admin Login page
│   ├── admin/
│   │   ├── layout.tsx              # Admin layout with Header & Sidebar
│   │   └── page.tsx                # Admin Dashboard overview
│   ├── layout.tsx                  # Root layout
│   └── page.tsx                    # Public Portal Launcher Hub
├── components/
│   ├── auth/
│   │   ├── LoginForm.tsx           # Login form component with validation & states
│   │   └── AuthProvider.tsx        # React Context for auth state & useAuth() hook
│   └── common/
│       └── DutAiHeader.tsx         # Unified header with Waffle & User Profile
├── lib/
│   └── auth.ts                     # Auth helpers: role checking, token decoding, fetch wrappers
└── middleware.ts                   # Route protection guard for /admin/*
```

## Complexity Tracking

> No unjustified complexity introduced. Uses Next.js native API routes and middleware with zero additional database or heavyweight dependencies.
