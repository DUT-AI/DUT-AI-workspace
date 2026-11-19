# Quickstart & End-to-End Validation Guide: DUT-AI Unified Workspace & True SSO

**Branch**: `001-unified-app-portal` | **Date**: 2026-11-20 | **Feature Spec**: [spec.md](file:///Users/nguyenhuynh/Documents/projects/DUT-AI-workspace/specs/001-unified-app-portal/spec.md)

---

## 1. Prerequisites

Before running the validation scenarios, ensure the following components are ready:
* **Cloudflare Worker**: Configured with route `workspace.dutai.io.vn/*` using [cloudflare-worker-gateway.js](file:///Users/nguyenhuynh/Documents/projects/DUT-AI-workspace/specs/001-unified-app-portal/contracts/cloudflare-worker-gateway.js).
* **Upstream Cloudflare Tunnels**:
  - `manage.dutai.io.vn` (VPS 1: `dut-ai-manager`)
  - `lms.dutai.io.vn` (VPS 2: `dut-ai-quiz`)
  - `meetly.dutai.io.vn` (VPS 3: `meetly`)
* **Shared Authentication Secret**:
  - `SHARED_JWT_SECRET` set identically across `.env` files of all 3 backends.
* **Next.js BasePaths Configured**:
  - `dut-ai-manager`: `basePath: '/manage'`
  - `dut-ai-quiz`: `basePath: '/lms'`
  - `meetly`: `basePath: '/meetly'`

---

## 2. Setup Commands

### 2.1 Backend Environment Variables
Ensure all three backends have the shared secret:

```bash
# In dut-ai-manager/backend/.env, dut-ai-quiz/apps/api/.env, meetly/core/.env
SHARED_JWT_SECRET="your-ultra-secure-random-256-bit-key-dut-ai-sso"
COOKIE_DOMAIN=".dutai.io.vn"
```

### 2.2 Sub-Apps Next.js Configuration Check
Verify that `next.config.mjs` in each web app exports `basePath`:

```javascript
// dut-ai-quiz/apps/web/next.config.mjs
const nextConfig = {
  basePath: '/lms',
  // ...
};
export default nextConfig;
```

---

## 3. End-to-End Validation Scenarios

### Scenario 1: True SSO Single Login Flow (P1 - 🎯 MVP)

* **Objective**: Log in once at `/login` and automatically gain authenticated access to all sub-services.
* **Steps**:
  1. Open Chrome/Firefox incognito and navigate to `https://workspace.dutai.io.vn/login`.
  2. Browser redirects to `https://workspace.dutai.io.vn/manage/login`.
  3. Enter valid DUT-AI credentials and submit.
  4. Inspect the `Set-Cookie` response header:
     - Name: `access_token`
     - Domain: `.dutai.io.vn`
     - Path: `/`
     - HttpOnly: `true`, Secure: `true`, SameSite: `Lax`
  5. In the same browser tab, navigate directly to `https://workspace.dutai.io.vn/lms/dashboard`.
  6. In another tab, navigate to `https://workspace.dutai.io.vn/meetly/tasks`.
* **Expected Outcome**:
  - Both LMS and Meetly immediately display the user's dashboard with their name and avatar.
  - Zero secondary login prompts or redirect loops occur.
  - Sub-app backends verify the JWT locally in RAM (< 0.1ms).

---

### Scenario 2: Single Unified Domain Subpaths & Asset Isolation (P1 - 🎯 MVP)

* **Objective**: Confirm 100% native DOM rendering without iframes and zero static chunk collisions.
* **Steps**:
  1. Open DevTools Elements tab on `https://workspace.dutai.io.vn/lms/dashboard`.
  2. Search for `<iframe` in DOM inspector.
  3. Inspect the Network tab while loading the page and filter by `_next/static`.
  4. Verify the asset URLs:
     - Notice chunks load from `https://workspace.dutai.io.vn/lms/_next/static/...`.
  5. Navigate to `https://workspace.dutai.io.vn/meetly/tasks`.
  6. Verify chunks load from `https://workspace.dutai.io.vn/meetly/_next/static/...`.
* **Expected Outcome**:
  - Total `<iframe>` count is **0**.
  - All CSS and JS bundles load with HTTP 200 without mixing or overwriting each other.
  - Page has a single native OS/browser scrollbar.

---

### Scenario 3: Google-Style 9-Dots Waffle Menu App Switching (P2)

* **Objective**: Switch seamlessly between apps using the unified OneBar navigation header.
* **Steps**:
  1. On any workspace page, click the 9-dots icon (`:::`) in the upper-right corner of the topbar.
  2. Observe the Waffle popover menu rendering:
     - **Quản lý (Manage)** (`/manage/dashboard`)
     - **Học tập & Khảo sát (LMS)** (`/lms/dashboard`)
     - **Quản lý Công việc (Meetly)** (`/meetly/tasks`)
  3. Click "Quản lý Công việc (Meetly)".
* **Expected Outcome**:
  - Browser navigates to `https://workspace.dutai.io.vn/meetly/tasks`.
  - The topbar (`DutAiHeader`) remains identical in styling, showing consistent brand, notification bell, and user avatar.

---

### Scenario 4: Global Single Logout (P1)

* **Objective**: Verify logging out from any sub-app terminates the session globally across all services.
* **Steps**:
  1. On `https://workspace.dutai.io.vn/meetly/tasks`, click the user avatar in the header.
  2. Click **"Đăng xuất"** (Logout).
  3. Check Network response: cookie `access_token` is cleared (`Max-Age=0; Domain=.dutai.io.vn`).
  4. Attempt to open `https://workspace.dutai.io.vn/lms/dashboard`.
* **Expected Outcome**:
  - LMS detects the missing/expired cookie and immediately redirects to `/login`.
  - All apps are locked simultaneously.

---

### Scenario 5: Edge Gateway Error Handling (P2)

* **Objective**: Confirm that a failure on one VPS does not break access to other VPSs.
* **Steps**:
  1. Simulate stopping Meetly tunnel or VPS.
  2. Navigate to `https://workspace.dutai.io.vn/meetly/tasks`.
* **Expected Outcome**:
  - Cloudflare Worker displays the branded DUT-AI maintenance screen: *"Meetly Tasks đang bảo trì"*.
  - Buttons *"Về Trang Quản lý"* and *"Về LMS"* allow immediate exit back to active services.
