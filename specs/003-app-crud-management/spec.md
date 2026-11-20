# Feature Specification: Ecosystem Application CRUD Management

**Feature Branch**: `003-app-crud-management`

**Created**: 2026-11-20

**Status**: Draft

**Input**: User description: "Hãy thêm chức năng crud để quản lý các trang web"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - View and List Ecosystem Applications (Priority: P1) 🎯 MVP

An authenticated administrator navigates to the application management area in the workspace administration dashboard to inspect all registered ecosystem websites and services. The interface presents a comprehensive list of applications displaying their title, URL, description, display icon, order, category/tags, and active/inactive status.

**Why this priority**: Foundational view required to inspect the current state of ecosystem applications before performing any creation, modifications, or deletions.

**Independent Test**: Log into the admin portal, open the application management screen, and verify that all registered applications are listed with accurate metadata and status badges.

**Acceptance Scenarios**:

1. **Given** an authenticated administrator on the administration portal, **When** they navigate to the applications management view, **Then** the system displays all registered ecosystem applications with their titles, URLs, icons, ordering index, and active status indicators.
2. **Given** an unauthenticated visitor or non-admin user, **When** they attempt to access the application management view, **Then** the system denies access and directs them to the authentication interface.

---

### User Story 2 - Register a New Ecosystem Application (Priority: P1)

An administrator registers a new application or external website to be included in the organization's ecosystem. They enter the application details (unique identifier, display title, public URL, description, category badge, visual icon, accent color, and display order) and submit the form. The system validates the inputs, persists the new application, and makes it available in the central app registry.

**Why this priority**: Essential administrative capability to expand the ecosystem whenever new services, platforms, or tools are deployed.

**Independent Test**: Create a new application with valid fields; verify that it immediately appears in the administration list, becomes accessible via the registry API, and appears in the public portal hub if marked active.

**Acceptance Scenarios**:

1. **Given** an administrator in the application creation form, **When** they submit valid details for a new application (unique identifier, title, URL starting with valid protocol), **Then** the application is persisted and immediately displayed in the applications list.
2. **Given** an administrator submitting an application with a duplicate identifier or invalid URL syntax, **When** the form is submitted, **Then** the system highlights the invalid field and prevents creation with a descriptive error message.

---

### User Story 3 - Edit Application Metadata and Display Status (Priority: P1)

An administrator modifies the configuration of an existing ecosystem application (such as updating its title, changing its URL, modifying its description, updating visual styling, or adjusting its display order). They can also toggle an application's visibility (active vs. inactive) to temporarily hide it from the launcher and 9-dots menu without deleting its records.

**Why this priority**: Critical maintenance capability for updating service domains, descriptions, or managing scheduled downtime by hiding inactive services.

**Independent Test**: Edit an existing application's title and toggle its active status to inactive; verify that public launcher views exclude the inactive service while the admin list retains and highlights it as disabled.

**Acceptance Scenarios**:

1. **Given** an existing application, **When** the administrator updates its attributes and saves, **Then** the modifications take effect immediately across all client surfaces.
2. **Given** an active application, **When** the administrator toggles its status to inactive, **Then** it is instantly hidden from public menus (Portal Hub and Waffle Menu) while remaining manageable in the administration panel.

---

### User Story 4 - Remove an Application from the Ecosystem (Priority: P2)

An administrator chooses to decommission an application that is no longer part of the organization's offerings. They trigger the delete action, are presented with a confirmation dialog to prevent accidental data loss, and confirm. The system removes the application from the registry.

**Why this priority**: Allows maintaining an uncluttered and up-to-date catalog of active organizational tools.

**Independent Test**: Select an application for removal, confirm deletion in the confirmation modal, and verify that the application is purged from the registry and no longer appears anywhere in the workspace.

**Acceptance Scenarios**:

1. **Given** an application in the administration list, **When** the administrator clicks delete and confirms the prompt, **Then** the application is permanently removed from the catalog.
2. **Given** the deletion confirmation dialog, **When** the administrator cancels the action, **Then** the application remains intact without changes.

---

### Edge Cases

- **Duplicate Identifier**: When attempting to create an application with an ID that already exists, the system blocks creation and prompts the user to select a unique ID.
- **Malformed URL Format**: When submitting an application URL without `http://` or `https://` protocol or with invalid characters, validation rejects the input before saving.
- **Concurrent Updates**: If multiple administrators modify the catalog, changes are safely persisted without data corruption.
- **De-registering Core Services**: When attempting to delete core system services (such as the Management system), the system warns the administrator of the critical nature of the service.
- **Public vs Admin Visibility**: Inactive applications must be filtered out for unauthenticated or standard public consumers, but must remain visible with an "Inactive" status badge for administrators.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide an administrative user interface for managing ecosystem applications at `/admin/apps` (or integrated into the administrative control plane).
- **FR-002**: System MUST support listing all registered ecosystem applications, including both active and inactive items, with their title, URL, description, visual icon, category badge, and display order.
- **FR-003**: System MUST provide a creation interface allowing administrators to register new applications with validation for required fields (`id`, `title`, `url`).
- **FR-004**: System MUST validate that application identifiers (`id`) are unique, lowercase, alphanumeric strings with optional hyphens.
- **FR-005**: System MUST validate that application URLs are well-formed web addresses beginning with `http://` or `https://`.
- **FR-006**: System MUST allow administrators to edit all metadata fields of existing applications.
- **FR-007**: System MUST provide a one-click toggle to switch an application between Active and Inactive states.
- **FR-008**: System MUST provide a deletion capability with a required confirmation step before removing an application record.
- **FR-009**: System MUST restrict all creation, update, toggle, and deletion operations strictly to authenticated users with the Administrator (`admin`) role.
- **FR-010**: System MUST expose an updated public registry API endpoint (`GET /api/v1/apps`) that returns only Active applications to public consumers and unauthenticated callers.
- **FR-011**: System MUST persist application configurations in durable storage so changes survive system restarts.

### Key Entities

- **EcosystemApp**: Represents an application or service in the workspace catalog.
  - `id`: Unique string identifier (e.g. `"manage"`, `"lms"`, `"meetly"`, `"data"`).
  - `title`: Display title of the application.
  - `shortName`: Optional condensed title for compact headers and badges.
  - `description`: Narrative description of the application's capabilities.
  - `icon`: Icon identifier representing the visual symbol.
  - `url`: Destination URL of the application.
  - `badge`: Categorical classification label (e.g. `"Quản trị"`, `"Đào tạo"`, `"Dữ liệu"`).
  - `tags`: List of searchable keywords/tags.
  - `accentColor`: Visual brand theme color for icon containers and cards.
  - `order`: Numeric sort weight for arranging apps in launchers and menus.
  - `isActive`: Boolean indicating whether the application is active and visible to general users.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Administrators can create, update, toggle, or delete an application in under 3 clicks from the application management view.
- **SC-002**: Updates made in the admin CRUD interface reflect immediately in the public Portal Hub and Waffle Menu within 1 second.
- **SC-003**: 100% of non-admin attempts to perform mutating operations (create, update, delete) are rejected with HTTP 403 Forbidden.
- **SC-004**: Zero data loss across server restarts: all added or modified applications remain intact in persistent storage.

## Assumptions

- The workspace application (`workspace.dutai.io.vn`) serves as the central registry source of truth for all ecosystem applications.
- The default seed data consists of the existing 4 core services (`manage`, `lms`, `meetly`, `data`).
- Changes made to the registry are immediately consumed by the Waffle Web Component (`waffle.js`) and Portal Hub (`/`).
