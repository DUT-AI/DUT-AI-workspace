# Quickstart Validation Guide: Admin Login & RBAC

**Feature**: `002-admin-login-rbac` | **Spec**: [spec.md](file:///Users/nguyenhuynh/Documents/projects/DUT-AI-workspace/specs/002-admin-login-rbac/spec.md)

This guide documents validation scenarios to test the Admin Login and Role-Based Access Control implementation end-to-end.

---

## 1. Prerequisites

- Node.js 18+ and npm installed
- Development server running on `http://localhost:3000` (or deployed at `https://workspace.dutai.io.vn`)
- Network connectivity to `https://manage.dutai.io.vn`

To start local server:
```bash
npm run dev
```

---

## 2. Validation Scenarios

### Scenario A: Successful Admin Login via API Proxy

Simulate submitting valid Admin credentials to `/api/auth/login`:

```bash
curl -i -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"huynhphuocnguyen.dev@gmail.com","password":"Nguyen123@"}'
```

**Expected Outcome**:
- HTTP 200 OK
- `Set-Cookie` header present with `access_token` and `refresh_token` scoped to `Domain=.dutai.io.vn`
- Response body contains:
  ```json
  {
    "is_success": true,
    "status_code": 200,
    "message": "Đăng nhập thành công",
    "data": {
      "user": {
        "email": "huynhphuocnguyen.dev@gmail.com",
        "name": "Huỳnh Phước Nguyên",
        "role_names": ["admin", "Trainer"]
      }
    }
  }
  ```

---

### Scenario B: Session Verification & Role Fetching (`/api/auth/me`)

Query current session with active cookie:

```bash
curl -s http://localhost:3000/api/auth/me \
  -H "Cookie: access_token=<VALID_ADMIN_JWT>"
```

**Expected Outcome**:
- HTTP 200 OK
- Returns hydrated user profile with `role_names: ["admin", "Trainer"]` and `is_admin: true`.

---

### Scenario C: Non-Admin Role Rejection (403 Forbidden)

Simulate a user logging in who does NOT have the `"admin"` role in `role_names`:

```bash
# If logging in with a non-admin account or calling /api/auth/me with non-admin token
curl -i -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"student@dutai.io.vn","password":"StudentPassword"}'
```

**Expected Outcome**:
- HTTP 403 Forbidden
- Response body contains localized error:
  ```json
  {
    "is_success": false,
    "status_code": 403,
    "message": "Tài khoản của bạn không có quyền truy cập trang quản trị. Chỉ quản trị viên (Admin) mới có quyền truy cập.",
    "data": null
  }
  ```
- No admin session created.

---

### Scenario D: Protected Route Middleware Guard

Attempt to navigate directly to `/admin` without authentication cookie:

```bash
curl -i http://localhost:3000/admin
```

**Expected Outcome**:
- HTTP 307 / 302 Redirect to `/login?redirect=/admin`.

Attempt to navigate to `/admin` with an active valid Admin cookie:

```bash
curl -i http://localhost:3000/admin \
  -H "Cookie: access_token=<VALID_ADMIN_JWT>"
```

**Expected Outcome**:
- HTTP 200 OK rendering the Admin Workspace Dashboard.

---

### Scenario E: Admin Sign-Out

Send sign-out request:

```bash
curl -i -X POST http://localhost:3000/api/auth/logout
```

**Expected Outcome**:
- HTTP 200 OK
- `Set-Cookie: access_token=; Max-Age=0; Path=/; Domain=.dutai.io.vn`
- `Set-Cookie: refresh_token=; Max-Age=0; Path=/; Domain=.dutai.io.vn`
- Access to `/admin` is immediately blocked.
