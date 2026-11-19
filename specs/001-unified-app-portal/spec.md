# Feature Specification: DUT-AI Unified Workspace & True Single Sign-On (SSO)

**Feature Branch**: `001-unified-app-portal`

**Created**: 2026-11-20

**Status**: Ready for Planning

**Input**: User description: "Đập đi xây lại: Bỏ hoàn toàn iframe. Kiến trúc chuẩn Google Workspace với 1 domain duy nhất https://workspace.dutai.io.vn/<tên_app> qua Cloudflare Worker/Tunnels. Triển khai True Single Sign-On (SSO) giữa dut-ai-manager, dut-ai-quiz (LMS), và meetly sử dụng shared JWT/Cookie. Tích hợp thanh Header OneBar chuẩn Google với nút 9 dấu chấm (Waffle App Launcher)."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - True Single Sign-On & Global Session (Priority: P1) 🎯 MVP

As an authenticated member of DUT-AI, I want to log in once at `https://workspace.dutai.io.vn/login` (or `/manage/login`), and automatically have active sessions across Management, LMS (`/lms`), and Meetly (`/meetly`), so that I never have to re-enter credentials or see secondary login screens when navigating between services.

**Why this priority**: Core value of an integrated ecosystem. Eliminates fragmented accounts and redundant logins.

**Independent Test**:
1. Log in at `https://workspace.dutai.io.vn/login`.
2. Navigate directly to `https://workspace.dutai.io.vn/lms/dashboard` and `https://workspace.dutai.io.vn/meetly/tasks`.
3. Verify both applications instantly recognize the authenticated user identity without prompting for login.
4. Click "Đăng xuất" (Logout) on any screen and verify all sessions are cleanly terminated across the entire domain.

**Acceptance Scenarios**:

1. **Given** a user logs in with valid credentials at `dut-ai-manager`, **When** the login succeeds, **Then** an `access_token` cookie is issued with `Domain=.dutai.io.vn; Path=/; HttpOnly; Secure; SameSite=Lax`.
2. **Given** an authenticated user opens `https://workspace.dutai.io.vn/lms/dashboard`, **When** the LMS backend receives the request with the `access_token` cookie, **Then** the backend decodes the token using the shared secret and authorizes the request in < 1ms without calling any remote auth APIs.
3. **Given** a user clicks Logout in the global header, **When** the logout request completes, **Then** the cookie is cleared for `.dutai.io.vn` and the user is redirected to `/login`.

---

### User Story 2 - Single Unified Domain Subpaths Without Iframe (Priority: P1) 🎯 MVP

As an end user, I want all DUT-AI services to run under one unified domain `https://workspace.dutai.io.vn/<tên_app>` as native web applications (no iframes), so that I enjoy native scrolling, responsive mobile experience, clean URL sharing, and zero cross-origin visual bugs.

**Why this priority**: Eliminates all iframe limitations (double scrollbars, mobile layout glitches, sandboxing hurdles) while fulfilling the user requirement of a single cohesive domain.

**Independent Test**:
1. Open `https://workspace.dutai.io.vn/manage/dashboard`.
2. Open `https://workspace.dutai.io.vn/lms/dashboard`.
3. Open `https://workspace.dutai.io.vn/meetly/tasks`.
4. Inspect the DOM to confirm 100% native HTML elements (zero `<iframe>` tags), native single scrollbar, and clean URLs in the address bar.

**Acceptance Scenarios**:

1. **Given** a request to `https://workspace.dutai.io.vn/lms/*`, **When** the Cloudflare Edge Gateway intercepts the request, **Then** it routes to the Cloudflare Tunnel of `dut-ai-quiz` while preserving the browser's URL as `workspace.dutai.io.vn/lms/*`.
2. **Given** a direct bookmark `https://workspace.dutai.io.vn/meetly/tasks`, **When** opened directly, **Then** the page loads the native Meetly task board with its CSS and JavaScript assets loaded from `/meetly/_next/...` without 404 errors.

---

### User Story 3 - Google-Style OneBar & 9-Dots App Launcher (Priority: P2)

As a user, I want every application to feature an identical top navigation bar (DutAiHeader / OneBar) equipped with a 9-dots icon (`:::`) App Launcher, so that I can instantly switch between Management, LMS, and Meetly just like navigating between Gmail, Google Meet, and Google Drive.

**Why this priority**: Creates the visual and interactive identity of a unified Google Workspace suite.

**Independent Test**:
1. On any page, click the 9-dots button (`:::`) in the top right header.
2. Verify a popover menu appears displaying all DUT-AI applications with their logos and titles.
3. Click "Meetly" and verify browser smoothly navigates to `https://workspace.dutai.io.vn/meetly/tasks` with the identical top bar active.

**Acceptance Scenarios**:

1. **Given** the user is viewing the LMS dashboard, **When** they click the 9-dots icon in the header, **Then** a grid menu opens showing Management, LMS (active), and Meetly Tasks.
2. **Given** the user clicks "Meetly" from the 9-dots menu, **When** the page transitions, **Then** the topbar branding, user profile, and notifications persist seamlessly.

---

### Edge Cases

- **Token Expiry & Auto-Refresh**: If an `access_token` expires (e.g. after 60 minutes), the sub-app's middleware transparently uses the `refresh_token` to renew the session at `manage.dutai.io.vn/api/v1/auth/refresh`, or smoothly redirects to `/login?returnUrl=...`.
- **Tunnel Outage**: If a specific VPS tunnel (e.g. Meetly) is temporarily down, Cloudflare Edge returns a custom 502/503 branded error page stating "Meetly is temporarily unavailable" without bringing down LMS or Management.
- **Old Subdomain Traffic**: If a user visits legacy links (`manage.dutai.io.vn`, `lms.dutai.io.vn`), Cloudflare automatically 301 redirects to `workspace.dutai.io.vn/<tên_app>`.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST route all applications under a single domain `https://workspace.dutai.io.vn` partitioned by subpath:
  - `/manage/*` $\rightarrow$ `dut-ai-manager` (`manage.dutai.io.vn`)
  - `/lms/*` $\rightarrow$ `dut-ai-quiz` (`lms.dutai.io.vn`)
  - `/meetly/*` $\rightarrow$ `meetly` (`meetly.dutai.io.vn`)
- **FR-002**: System MUST NOT use `<iframe>` wrappers. All applications render as native DOM with independent server-rendered or client-rendered pages.
- **FR-003**: System MUST implement True Single Sign-On (SSO) centered at `dut-ai-manager` as the Identity Provider (IdP).
- **FR-004**: System MUST issue unified authentication cookies (`access_token`, `refresh_token`) scoped to `Domain=.dutai.io.vn; Path=/; HttpOnly; Secure; SameSite=Lax`.
- **FR-005**: Resource servers (`dut-ai-quiz`, `meetly`) MUST verify the shared JWT token directly in-memory using `SHARED_JWT_SECRET` without making remote network calls to `manage.dutai.io.vn` on every request.
- **FR-006**: Sub-applications MUST configure `basePath` in their Next.js configuration (`/manage`, `/lms`, `/meetly`) to ensure static assets (`_next/static`) and internal routes never collide.
- **FR-007**: System MUST provide a unified Header component (`DutAiHeader`) containing DUT-AI branding, a 9-dots Waffle App Launcher (`:::`), notification bell, and user avatar with global logout.

### Key Entities

- **SSO Identity Claim**: Represents the authenticated user across all apps (`sub`, `email`, `name`, `role_names`, `exp`).
- **Service Route Configuration**: Mapping of subpaths (`/manage`, `/lms`, `/meetly`) to upstream Cloudflare Tunnels.
- **Ecosystem App Registry**: Metadata for all registered apps (id, title, description, icon, route) rendered in the 9-dots App Launcher.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of services accessible under single domain `https://workspace.dutai.io.vn/<app>` with 0 occurrences of `<iframe>`.
- **SC-002**: Users log in once and access Management, LMS, and Meetly with 0 secondary login prompts (100% SSO success rate).
- **SC-003**: Sub-app authentication validation latency is < 1ms (in-memory JWT decode) per API request.
- **SC-004**: 0 asset collision or CSS/JS 404 errors between `/manage`, `/lms`, and `/meetly`.
- **SC-005**: 1-click navigation between any two applications via the 9-dots App Launcher.

## Assumptions

- Services run across separate VPSs, each connected to Cloudflare via `cloudflared` tunnel.
- Cloudflare Worker is used as the Edge Gateway for `workspace.dutai.io.vn`.
- Domain DNS for `dutai.io.vn` is managed on Cloudflare.
- The organization has authority to update code in `dut-ai-manager`, `dut-ai-quiz`, and `meetly`.
