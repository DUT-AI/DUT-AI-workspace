# Phase 0 Research: True SSO & Cloudflare Multi-Zones Gateway (Zero Iframe)

**Branch**: `001-unified-app-portal` | **Date**: 2026-11-20 | **Feature Spec**: [spec.md](file:///Users/nguyenhuynh/Documents/projects/DUT-AI-workspace/specs/001-unified-app-portal/spec.md)

---

## 1. Research Overview

The project is undergoing a fundamental architectural rebuild ("đập đi xây lại"):
* **Old Architecture**: Seamless Iframe Shell (`app.dutai.io.vn` wrapping sub-apps with iframes).
* **New Architecture**:
  1. **Zero Iframe (100% Native Web DOM)**: All applications run as native pages under a single domain `https://workspace.dutai.io.vn/<tên_app>`.
  2. **True Single Sign-On (SSO)**: `dut-ai-manager` acts as the single central Identity Provider (IdP). It issues a unified JWT stored in an HTTP cookie (`Domain=.dutai.io.vn; Path=/; HttpOnly; SameSite=Lax`). Resource servers (`dut-ai-quiz`, `meetly`) verify the JWT in RAM using `SHARED_JWT_SECRET` (< 0.1ms latency, 0 remote HTTP calls).
  3. **Multi-VPS Edge Gateway (Cloudflare Worker)**: Proxies subpaths (`/manage`, `/lms`, `/meetly`) to the corresponding Cloudflare Tunnels across different VPS servers with 0ms infrastructure overhead.
  4. **Google OneBar Component (`DutAiHeader`)**: A unified, reusable top navigation bar featuring a 9-dots Waffle App Launcher (`:::`), notification bell, and user avatar.

---

## 2. Research Findings & Technical Decisions

### Decision 1: Authentication Model — Central IdP vs Proxy Auth

- **Context**: In the current codebase, `dut-ai-quiz` and `meetly` call `manage.dutai.io.vn` only for credential verification, then each backend generates its own separate JWT token and sets separate cookies.
- **Problem**:
  - If unified under `workspace.dutai.io.vn`, multiple backends setting cookie `access_token` with different JWT secrets causes token collision and immediate 401 Unauthorized errors.
  - Users have to log in multiple times.
- **Decision**: Adopt **Standard Central Identity Provider (True SSO)**:
  - `dut-ai-manager` is the SOLE issuer of `access_token` and `refresh_token`.
  - Sub-app backends (`quiz`, `meetly`) do NOT create their own tokens. They act purely as **Resource Servers**.
  - All backends share a secret key `SHARED_JWT_SECRET` (or RSA Public Key).
  - Validation:
    ```python
    # Sub-app backend JWT verification in-memory (FastAPI / Starlette)
    payload = jwt.decode(token, settings.SHARED_JWT_SECRET, algorithms=["HS256"])
    user_id = payload["sub"]
    role_names = payload["role_names"]
    ```
- **Rationale**:
  - Log in once at `/login`, immediately access `/manage`, `/lms`, and `/meetly`.
  - Zero network overhead during authorization.
  - Consistent token expiry and global single logout.
- **Alternatives Considered**:
  - *Cookie Path partitioning*: Rejected by user in favor of True SSO.
  - *OAuth2/OIDC code exchange*: Overly complex for internal trusted first-party apps sharing the same parent domain. Shared secret JWT is simpler, faster, and enterprise-grade.

---

### Decision 2: Multi-VPS Subpath Routing — Cloudflare Worker Gateway

- **Context**: The user's services are hosted across **different VPS servers** connected via Cloudflare Tunnels (`cloudflared`). Nginx on localhost is not applicable because the servers are geographically/network isolated.
- **Decision**: Deploy a **Cloudflare Worker** as the Edge Gateway for `https://workspace.dutai.io.vn/`:
  - When request is `/manage/*` $\rightarrow$ forwards to Tunnel `https://manage.dutai.io.vn/*`.
  - When request is `/lms/*` $\rightarrow$ forwards to Tunnel `https://lms.dutai.io.vn/*`.
  - When request is `/meetly/*` $\rightarrow$ forwards to Tunnel `https://meetly.dutai.io.vn/*`.
- **Rationale**:
  - Runs at Cloudflare Edge with global DNS.
  - 0 additional VPS servers or VPN tunnels needed.
  - Preserves user browser URL as `workspace.dutai.io.vn/<tên_app>`.
  - Free tier covers 100,000 requests/day.
- **Alternatives Considered**:
  - *Central Nginx VPS reverse-proxying over public internet*: High latency (double hop), requires managing an extra VPS.
  - *WireGuard VPN mesh between all VPSs*: Complex networking, single point of failure.

---

### Decision 3: Sub-App Route Partitioning & `basePath`

- **Context**: In Next.js, static assets (`_next/static/chunks/...`) by default reside at the domain root (`/_next/...`). If three Next.js apps share one domain, requests for `/_next/...` collide.
- **Decision**: Configure `basePath` in each sub-app's `next.config.mjs`:
  - `dut-ai-manager`: `basePath: '/manage'`
  - `dut-ai-quiz`: `basePath: '/lms'`
  - `meetly`: `basePath: '/meetly'`
- **Rationale**: Next.js automatically prefixes all internal routes and static assets (e.g. `/lms/_next/static/...`), eliminating 100% of asset collisions.
- **Backward Compatibility for Legacy URLs**:
  - In each app's `next.config.mjs`, add a redirect rule:
    ```javascript
    async redirects() {
      return [
        {
          source: '/',
          destination: `${basePath}/dashboard`,
          basePath: false,
          permanent: false,
        },
      ];
    }
    ```
  - Users visiting old bookmarks without the prefix are automatically redirected without 404 errors.

---

### Decision 4: UI Navigation — Google OneBar (`DutAiHeader`)

- **Context**: Need a cohesive visual experience so users feel they are inside a unified workspace suite (like Google Workspace).
- **Decision**: Implement a reusable **`DutAiHeader`** React component:
  - Top bar fixed at `h-14` (56px) with DUT-AI branding.
  - **9-dots Waffle App Launcher (`:::` icon)** opening a grid popover linking to `/manage`, `/lms`, and `/meetly`.
  - Notification bell indicator.
  - User profile avatar dropdown with unified Logout action (`POST /api/v1/auth/logout`).
- **Rationale**: Provides the familiar, world-class Google Workspace user experience while keeping repos decoupled.

---

## 3. Technology Stack Selection

| Component | Selected Technology | Role |
|-----------|---------------------|------|
| **Central Identity Provider** | `dut-ai-manager` (FastAPI + PostgreSQL) | Issues shared JWT and sets wildcard cookie. |
| **Resource Server 1** | `dut-ai-quiz` (FastAPI backend + Next.js frontend) | Verifies shared JWT in RAM, serves `/lms/*`. |
| **Resource Server 2** | `meetly` (FastAPI backend + Next.js frontend) | Verifies shared JWT in RAM, serves `/meetly/*`. |
| **Edge Gateway** | Cloudflare Worker (V8 Serverless JS) | Routes `workspace.dutai.io.vn` subpaths to tunnels. |
| **Tunnel Layer** | `cloudflared` (Cloudflare Tunnel) | Secure egress from each VPS to Cloudflare Edge. |
| **Shared Header UI** | React + Tailwind CSS + Lucide Icons | Renders Google OneBar with 9-dots menu in each app. |
