# Feature Specification: Admin Login and Role-Based Access Control (RBAC)

**Feature Branch**: `002-admin-login-rbac`

**Created**: 2026-11-20

**Status**: Draft

**Input**: User description: "tôi mong muốn sẽ có thêm giao diện đăng nhập ở workspace nữa, chỉ có role admin mới được vào https://manage.dutai.io.vn/api/v1/auth/login POST body { email, password } và API get me https://manage.dutai.io.vn/api/v1/auth/me GET với cookie đã được set vào req là trả về"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Administrator Authentication and Portal Access (Priority: P1)

An administrator visits the workspace portal, navigates to the admin login interface, inputs their registered email and password, and submits. The system authenticates against the central identity service, verifies the user possesses administrator privileges, and grants access to the protected administration dashboard.

**Why this priority**: Core functionality that enables authorized administrators to securely access and manage workspace ecosystem configurations, application registries, and portal settings.

**Independent Test**: Can be fully tested by entering valid administrator credentials on the login page; the system verifies the credentials and administrator role, establishing a secure session and landing on the administration dashboard.

**Acceptance Scenarios**:

1. **Given** an unauthenticated administrator on the workspace login page, **When** they submit valid administrator credentials, **Then** the system establishes the authenticated session and navigates the user to the administration dashboard.
2. **Given** an authenticated administrator accessing protected administration views, **When** the page loads, **Then** the system verifies the active session against `GET https://manage.dutai.io.vn/api/v1/auth/me` and displays the administrator's profile information (name, email, avatar).

---

### User Story 2 - Non-Admin Access Denial and RBAC Enforcement (Priority: P1)

A user with valid credentials but non-admin role (such as a standard member, student, or guest) attempts to log in via the workspace login page or directly navigate to a protected administration route. The system verifies their profile, detects the absence of the administrator role, explicitly rejects access, and prevents entry to any administration screens.

**Why this priority**: Vital security barrier ensuring that sensitive portal administrative controls and configurations are strictly isolated from non-privileged accounts.

**Independent Test**: Can be fully tested by attempting login with valid non-admin credentials; the system denies access with a clear authorization refusal message and blocks navigation to administrative routes.

**Acceptance Scenarios**:

1. **Given** a user with valid credentials but without the administrator role in `role_names`, **When** they submit their credentials on the workspace login page, **Then** the system rejects the login attempt with an explicit denial notice (e.g., "Tài khoản của bạn không có quyền truy cập trang quản trị") and leaves the administration area locked.
2. **Given** an active non-admin session cookie, **When** the user attempts to directly access any protected administration URL, **Then** the system intercepts the request, blocks access, and redirects the user to the public portal or login page.

---

### User Story 3 - Single Sign-On Recognition and Auto-Redirect (Priority: P2)

An administrator who is already authenticated within the organization's domain visits the workspace login page. The system recognizes the existing valid session cookie, queries the user profile, verifies the administrator role, and automatically forwards them to the administrative dashboard without requiring them to re-enter credentials.

**Why this priority**: Streamlines the user experience across the ecosystem by leveraging cross-subdomain single sign-on (SSO).

**Independent Test**: Can be fully tested by visiting the login page with pre-existing valid admin session cookies; the system automatically redirects to the admin dashboard.

**Acceptance Scenarios**:

1. **Given** an administrator who already holds an active session cookie on the organization domain, **When** they visit the workspace login page, **Then** the system automatically verifies their session and redirects them directly to the admin dashboard.
2. **Given** a user whose session cookie has expired or been revoked, **When** they attempt to load protected administration screens, **Then** the system clears the invalid session state and redirects them to the login page.

---

### User Story 4 - Administrator Sign-Out (Priority: P2)

An authenticated administrator wishes to conclude their administrative session. They trigger the sign-out action from the workspace header or profile menu. The system terminates the session, clears authentication cookies, and returns the user to the unauthenticated public portal or login screen.

**Why this priority**: Essential session management and hygiene, enabling administrators to safely log out on shared or temporary devices.

**Independent Test**: Can be fully tested by clicking the sign-out button; the system removes the session and restricts access to protected administrative views until re-authenticated.

**Acceptance Scenarios**:

1. **Given** an authenticated administrator on any workspace view, **When** they click the sign-out action, **Then** the session cookies are cleared and the user is redirected to the login screen or public portal.

---

### Edge Cases

- **Invalid Credentials**: When a user enters an incorrect email or password, the system displays a clear error message (e.g., "Email hoặc mật khẩu không chính xác") and keeps the form active for retry without resetting the email field.
- **Multiple Roles Assignment**: When an administrator has multiple roles assigned in their profile (e.g., `["admin", "Trainer"]` or `["Trainer", "admin"]`), the system evaluates the roles case-insensitively and recognizes administrative access if "admin" is present.
- **Service Unavailability or Network Error**: When the central identity service (`manage.dutai.io.vn`) is unreachable or returns a server error, the login interface displays a helpful error message (e.g., "Không thể kết nối đến máy chủ xác thực. Vui lòng thử lại sau.") rather than crashing or freezing.
- **Deactivated or Blocked Account**: When an authenticated user's account status is not active (e.g., status is not "ACTIVE" or `is_deleted` is true), the system denies entry and notifies the user accordingly.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide a dedicated administrative login interface with input fields for email and password, a submit action, and visual loading/error states.
- **FR-002**: System MUST validate input fields on the client before submission, verifying that email matches standard email formatting and password is not blank.
- **FR-003**: System MUST transmit authentication requests to the external identity service endpoint `POST https://manage.dutai.io.vn/api/v1/auth/login` containing the user email and password.
- **FR-004**: System MUST verify the active session and retrieve the user's current identity and roles from `GET https://manage.dutai.io.vn/api/v1/auth/me` using the received authentication cookies.
- **FR-005**: System MUST enforce Role-Based Access Control (RBAC), verifying that the user profile's `role_names` contains the administrator role (case-insensitive "admin") before granting access to administration screens.
- **FR-006**: System MUST reject access for accounts that authenticate successfully with `POST /api/v1/auth/login` but do not possess the administrator role, presenting an explicit access denied notification in Vietnamese.
- **FR-007**: System MUST guard all administration routes, intercepting unauthenticated or non-admin requests and redirecting them to the login page or public portal.
- **FR-008**: System MUST support automatic session detection on the login page, redirecting already authenticated administrators straight to the administration dashboard.
- **FR-009**: System MUST provide a sign-out mechanism that clears authentication cookies and returns the user to the unauthenticated view.
- **FR-010**: System MUST display the administrator's profile information (name, email, avatar) in the workspace interface once logged in.

### Key Entities

- **AuthCredentials**: Encapsulates user login inputs consisting of `email` (string) and `password` (string).
- **AdminUserProfile**: Encapsulates identity and authorization attributes retrieved from the identity service, including `id` (identifier), `name` (string), `email` (string), `avatar_url` (string), `status` (string), `role_names` (list of role identifiers), and `permissions` (list of permission identifiers).
- **AdminSessionState**: Encapsulates the client session status: unauthenticated, authenticating, authorized admin, or forbidden non-admin.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of non-admin accounts attempting to access administrative views are intercepted and denied access.
- **SC-002**: Administrators can complete the login process and view the admin dashboard in under 3 seconds under normal network conditions.
- **SC-003**: 100% of session errors (invalid credentials, expired session, unauthorized role, network disconnection) display clear, localized Vietnamese feedback to the user.
- **SC-004**: Existing active administrator sessions across the `.dutai.io.vn` domain are recognized within 1 second of loading the login page.

## Assumptions

- The central identity service `https://manage.dutai.io.vn` is the source of truth for user authentication and role management.
- The authentication endpoint `POST https://manage.dutai.io.vn/api/v1/auth/login` sets cross-subdomain cookies scoped to `.dutai.io.vn` (`access_token` and `refresh_token`).
- The identity endpoint `GET https://manage.dutai.io.vn/api/v1/auth/me` accepts the session cookie and returns user profile details containing `role_names`.
- Role assignment for administrators is represented by the string `"admin"` (case-insensitive) in the `role_names` array.
- Workspace administrative features will be located under an administrative route hierarchy (e.g. `/admin` or `/dashboard`).
