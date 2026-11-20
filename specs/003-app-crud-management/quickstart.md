# Quickstart Validation Guide: Ecosystem Application CRUD

**Feature**: `003-app-crud-management` | **Spec**: [spec.md](file:///Users/nguyenhuynh/Documents/projects/DUT-AI-workspace/specs/003-app-crud-management/spec.md)

This guide documents validation scenarios to test the Application CRUD Management functionality end-to-end via CLI / cURL and web interface.

---

## 1. Prerequisites

- Development server running on `http://localhost:3000` (or `PORT=3333`)
- Active admin access token `access_token` from `POST /api/auth/login`

---

## 2. Validation Scenarios

### Scenario A: List Applications (Public vs Admin)

Public query (returns only active apps):
```bash
curl -s http://localhost:3000/api/v1/apps | jq .
```
**Expected Outcome**: Returns array of active apps (`manage`, `lms`, `meetly`, `data`).

Admin query (returns all apps including inactive ones):
```bash
curl -s "http://localhost:3000/api/v1/apps?all=true" \
  -H "Cookie: access_token=<ADMIN_TOKEN>" | jq .
```

---

### Scenario B: Register a New Application (`POST /api/v1/apps`)

```bash
curl -i -X POST http://localhost:3000/api/v1/apps \
  -H "Content-Type: application/json" \
  -H "Cookie: access_token=<ADMIN_TOKEN>" \
  -d '{
    "id": "docs",
    "title": "DUT-AI Documentation",
    "shortName": "Docs",
    "description": "Tài liệu kỹ thuật và hướng dẫn sử dụng hệ thống DUT-AI",
    "icon": "FileText",
    "url": "https://docs.dutai.io.vn",
    "badge": "Tài liệu",
    "tags": ["Docs", "Hướng dẫn", "Wiki"],
    "accentColor": "bg-cyan-600",
    "order": 5,
    "isActive": true
  }'
```

**Expected Outcome**:
- HTTP 201 Created
- Body contains newly created app record.
- Immediate reflection in `GET /api/v1/apps`.

---

### Scenario C: Non-Admin Rejection (RBAC Enforcement)

Attempting to create an app without admin credentials:
```bash
curl -i -X POST http://localhost:3000/api/v1/apps \
  -H "Content-Type: application/json" \
  -d '{"id":"hack","title":"Hacked App","description":"test","icon":"Globe","url":"https://evil.com"}'
```

**Expected Outcome**:
- HTTP 401 Unauthorized or HTTP 403 Forbidden.
- Mutation is blocked.

---

### Scenario D: Update & Toggle Status (`PUT /api/v1/apps/[id]` & `PATCH /api/v1/apps/[id]/toggle`)

Toggle visibility:
```bash
curl -i -X PATCH http://localhost:3000/api/v1/apps/docs/toggle \
  -H "Cookie: access_token=<ADMIN_TOKEN>"
```

**Expected Outcome**:
- HTTP 200 OK.
- `isActive` changed from `true` to `false`.
- Public `GET /api/v1/apps` no longer includes `docs`.
- Admin `GET /api/v1/apps?all=true` still includes `docs` with `isActive: false`.

---

### Scenario E: Delete Application (`DELETE /api/v1/apps/[id]`)

```bash
curl -i -X DELETE http://localhost:3000/api/v1/apps/docs \
  -H "Cookie: access_token=<ADMIN_TOKEN>"
```

**Expected Outcome**:
- HTTP 200 OK with success message.
- App `docs` is permanently removed from storage.
