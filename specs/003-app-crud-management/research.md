# Research: Ecosystem Application CRUD Management

**Feature**: `003-app-crud-management` | **Spec**: [spec.md](file:///Users/nguyenhuynh/Documents/projects/DUT-AI-workspace/specs/003-app-crud-management/spec.md)

## Decisions & Technical Choices

### 1. Persistent Storage Mechanism for App Registry

- **Context**: The ecosystem applications were previously hardcoded in `src/config/apps.ts`. We need persistent CRUD capability for administrators.
- **Decision**: Implement a file-backed JSON storage engine (`data/apps.json`) managed by `src/lib/app-storage.ts`, with automatic fallback to seed data from `src/config/apps.ts` on first initialization.
- **Rationale**:
  - The ecosystem consists of dozens of apps (typically 4 to 30), for which a relational database like PostgreSQL or MySQL is unnecessary overhead.
  - JSON file storage provides 0ms network latency, zero external database maintenance, and survives server reboots on VPS or Docker deployments.
  - Atomic write operations (writing to temporary file and replacing) prevent race conditions or partial writes.
- **Alternatives Considered**:
  - *Database (PostgreSQL / SQLite)*: Requires ORM, migrations, and database server setup for a simple 10-row dataset. Unnecessary complexity.
  - *Hardcoded TypeScript*: Static; requires code commit and rebuild for every new link or description change.

---

### 2. API Design & RBAC Protection

- **Context**: Need API endpoints for client components, external apps (Waffle Menu), and admin operations.
- **Decision**:
  - Public endpoint: `GET /api/v1/apps`
    - By default, returns only active apps (`isActive === true`), sorted by `order`.
    - If `?all=true` is requested and caller has valid Admin credentials, returns all apps (active & inactive).
  - Admin mutating endpoints:
    - `POST /api/v1/apps`: Create new app.
    - `PUT /api/v1/apps/[id]`: Update existing app.
    - `DELETE /api/v1/apps/[id]`: Delete app.
    - `PATCH /api/v1/apps/[id]/toggle`: One-click toggle active/inactive status.
  - RBAC verification helper (`requireAdmin` in `src/lib/auth.ts`):
    - Inspects `access_token` cookie or `Authorization` header.
    - Decodes JWT payload and verifies `hasAdminRole(roles)`.
    - Also verifies session against `https://manage.dutai.io.vn/api/v1/auth/me` when needed.
    - Rejects unauthorized requests with HTTP 401 or 403.
- **Rationale**: Clean REST architecture, backward-compatible with existing Waffle component, secure by default.

---

### 3. User Interface & Experience

- **Context**: Administrators need an intuitive, responsive interface on `/admin/apps` to manage apps effortlessly.
- **Decision**:
  - Build `AppManagementClient` component on `/admin/apps`:
    - Search and filter bar (search by title, url, tags).
    - Grid/Table view displaying App Icon, Title, URL, Category Badge, Order, and Active Status Toggle.
    - "Thêm ứng dụng mới" button triggering a slide-over/modal `AppFormModal`.
    - "Chỉnh sửa" action for existing apps.
    - "Xóa" action with safe confirmation modal `DeleteConfirmModal`.
    - Pre-defined palette of modern Lucide icons (`LayoutDashboard`, `GraduationCap`, `CheckSquare`, `Database`, `Sparkles`, `Globe`, `Bot`, `Cpu`, `FileText`, `BarChart`) and Tailwind color presets.
- **Rationale**: Matches Google Workspace Admin Console aesthetics, highly productive for administrators.
