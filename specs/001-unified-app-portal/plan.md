# Implementation Plan: DUT-AI Unified Workspace & True Single Sign-On (SSO)

**Branch**: `001-unified-app-portal` | **Date**: 2026-11-20 | **Spec**: [spec.md](file:///Users/nguyenhuynh/Documents/projects/DUT-AI-workspace/specs/001-unified-app-portal/spec.md)

**Input**: Feature specification from `/specs/001-unified-app-portal/spec.md`

## Summary

Completely overhaul ("đập đi xây lại") the integration of three distinct DUT-AI applications:
- **DUT-AI Management (`dut-ai-manager`)**: `https://manage.dutai.io.vn/dashboard`
- **DUT-AI LMS (`dut-ai-quiz`)**: `https://lms.dutai.io.vn/dashboard`
- **Meetly Tasks (`meetly`)**: `https://meetly.dutai.io.vn/tasks`

The new architecture operates with:
1. **Zero Iframe (100% Native Web DOM)**: Eliminates all iframes, providing native browser scrolling, responsive mobile rendering, and zero cross-origin visual glitches.
2. **Single Domain Multi-Zones Gateway (`workspace.dutai.io.vn/<tên_app>`)**: A Cloudflare Edge Worker routes `/manage/*`, `/lms/*`, and `/meetly/*` directly to each service's Cloudflare Tunnel across different VPS servers with 0ms infrastructure latency.
3. **True Single Sign-On (SSO)**: `dut-ai-manager` acts as the single central Identity Provider (IdP) issuing an `access_token` cookie scoped to `Domain=.dutai.io.vn`. Sub-app backends act as Resource Servers, verifying the JWT locally in RAM (< 0.1ms) using a shared secret (`SHARED_JWT_SECRET`), completely removing separate token generation in sub-apps.
4. **Google Workspace Experience (OneBar + Waffle App Launcher)**: Shared `DutAiHeader` component across all sub-apps featuring DUT-AI branding and the 9-dots icon (`:::`) to switch between applications seamlessly.

## Technical Context

**Language/Version**: TypeScript 5.x / Next.js 14-15 (Frontend), Python 3.11 / FastAPI (Backend)

**Primary Dependencies**:
- Frontend: Next.js (App Router), React 18/19, Tailwind CSS, Lucide React (icons)
- Backend: FastAPI, PyJWT / python-jose, pydantic
- Edge/Gateway: Cloudflare Workers (JavaScript ES Modules)

**Storage**:
- HTTP-Only Cookies: `access_token`, `refresh_token` (`Domain=.dutai.io.vn; Path=/; SameSite=Lax; Secure`)
- RAM Cache: In-memory JWT verification (< 0.1ms)

**Testing**:
- Unit Tests: JWT verification tests, Route matching tests, AppRegistry validation
- Integration Tests: Multi-zone proxy routing via Cloudflare Worker, Subpath asset loading tests
- E2E Tests: Single Sign-On flow, 9-dots Waffle switching, Global logout

**Target Platform**: Cloudflare Edge + Distributed VPS instances (via Cloudflare Tunnels)

**Performance Goals**:
- In-memory JWT verification latency: < 0.1ms per request (0 remote HTTP calls)
- Subpath edge proxy routing latency: < 10ms at Cloudflare edge
- Zero double scrollbars, zero iframe sandboxing issues

**Constraints**:
- Sub-apps run on different VPS instances connected via `cloudflared` tunnels.
- Sub-apps MUST configure `basePath` in `next.config.mjs` (`/manage`, `/lms`, `/meetly`) to isolate `_next/static` assets.
- Cookie name and JWT secret MUST be synchronized across all repositories.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Zero Iframe & Native Web DOM**: PASS. Fully native DOM with individual responsive rendering.
- **Simplicity & True SSO**: PASS. Eliminates duplicate login mechanisms and token mismatch bugs by delegating token issuance exclusively to `dut-ai-manager`.
- **Fault Tolerance**: PASS. Cloudflare Worker Edge Gateway provides custom fallback UI if an individual VPS tunnel goes down, without disrupting active services.
- **Asset Isolation**: PASS. Dedicated `basePath` per sub-app avoids chunk conflicts in `_next/static`.

## Project Structure

### Documentation (this feature)

```text
specs/001-unified-app-portal/
├── spec.md              # Feature Specification (Zero Iframe, True SSO, Multi-Zones)
├── plan.md              # Implementation Plan (/speckit-plan output)
├── research.md          # Phase 0 Research (SSO IdP vs Resource Server, Cloudflare Worker)
├── data-model.md        # Phase 1 Data Model (SSOIdentityClaim, AppRegistryItem, GatewayRouteRule)
├── quickstart.md        # Phase 1 End-to-End Validation Guide
├── contracts/           # Phase 1 Contracts & Edge Worker Code
│   ├── cloudflare-worker-gateway.js # Production Cloudflare Worker script
│   └── jwt-claims-schema.json       # JSON Schema for True SSO JWT & Cookie attributes
└── checklists/          # Feature Quality Checklists
    └── requirements.md
```

### Source Repositories Impacted

```text
1. Cloudflare Edge:
   └── workers/gateway/index.js       # Cloudflare Worker for workspace.dutai.io.vn

2. DUT-AI Manager (IdP):
   ├── backend/app/auth/controller.py # Issue cookie with domain=".dutai.io.vn"
   └── web/next.config.mjs            # basePath: '/manage'

3. DUT-AI Quiz / LMS (Resource Server):
   ├── apps/api/app/application/      # Bypass local session creation, verify manager JWT
   └── apps/web/next.config.mjs       # basePath: '/lms'

4. Meetly (Resource Server):
   ├── modules/identity/              # Verify manager JWT directly in RAM
   └── web/next.config.mjs            # basePath: '/meetly'

5. Shared OneBar Component (workspace repo & sub-apps):
   └── components/DutAiHeader.tsx     # Google-style topbar with 9-dots waffle menu
```

## Complexity Tracking

*No violations. All design gates satisfied.*
