# DevPortal Backend (`server/`)

Spring Boot 3 backend for DevPortal – centralized credentials and environment management.

## Tech Stack

- Java 21
- Spring Boot 3 (Web, Security, Data JPA, Validation)
- PostgreSQL
- JWT (JJWT)
- Gradle

## Getting Started

### 1. Configure PostgreSQL

Create a database (e.g. `devportal`) and user with permissions.

Either set environment variables:

- `DEVPORTAL_DB_HOST` (default: `localhost`)
- `DEVPORTAL_DB_PORT` (default: `5432`)
- `DEVPORTAL_DB_NAME` (default: `devportal`)
- `DEVPORTAL_DB_USER` (default: `devportal`)
- `DEVPORTAL_DB_PASSWORD` (default: `devportal`)

Or edit `src/main/resources/application.yml` directly.

> Schema is managed by Hibernate with `spring.jpa.hibernate.ddl-auto=update` (no Flyway).

### 2. Configure Secrets

In `application.yml`:

- `devportal.jwt.secret` – **base64-encoded** secret for signing JWTs  
  (set via env `DEVPORTAL_JWT_SECRET` in real setups)
- `devportal.encryption.key` – 32‑byte string for AES‑GCM encryption of credential values  
  (set via env `ENCRYPTION_KEY` in real setups)

For local dev you can keep the defaults but **never** use them in shared/stage/prod.

### 3. Build & Run

From repo root:

```bash
cd server

# (first time) generate Gradle wrapper if needed
gradle wrapper

# run the app
./gradlew bootRun
```

The API will be available at `http://localhost:8080`.

## Auth & Roles

- Users: `users` table with columns:
  - `email` (unique), `password_hash` (BCrypt), `role` (`DEVELOPER` / `ADMIN`), `is_active`
- JWT:
  - `POST /api/auth/login` – `{ "email", "password" }` → `{ "accessToken", "refreshToken" }`
  - `POST /api/auth/refresh` – `{ "refreshToken" }` → new tokens
  - `POST /api/auth/logout` – no-op backend; client discards tokens
- Security:
  - `/api/auth/**` is public
  - all other `/api/**` require a valid `Authorization: Bearer <accessToken>` header
  - admin-only endpoints are protected with `@PreAuthorize("hasRole('ADMIN')")`

You should seed at least one admin user manually (SQL insert) or add a one-off bootstrap routine using `AuthService.ensureDefaultAdmin(...)`.

## Data Model (hierarchy)

**Environment → Project → Credentials**

- **Environment** (e.g. `qa`, `staging`, `prod`) – top level; contains many projects.
- **Project** (e.g. `air-sms`, `supply-core`) – belongs to one environment; contains credentials.
- **Credentials** – belong to one project (key/value, type, description, etc.).

## Main API Surface

### Environments

- `GET /api/envs` – list all environments (any authenticated user)
- `POST /api/envs` – create environment (admin)
- `PUT /api/envs/{id}` – update environment (admin)
- `DELETE /api/envs/{id}` – delete environment (admin)

### Projects (under an environment)

- `GET /api/envs/{envId}/projects` – list projects in an environment
- `POST /api/envs/{envId}/projects` – create project (admin)
- `PUT /api/envs/{envId}/projects/{projectId}` – update project (admin)
- `DELETE /api/envs/{envId}/projects/{projectId}` – delete project (admin)

### Credentials (under a project)

- `GET /api/projects/{projectId}/credentials` – list credentials (values always `***`)
- `GET /api/projects/{projectId}/credentials/{credentialId}/reveal` – reveal decrypted value and log access
- `POST /api/projects/{projectId}/credentials` – create credential (admin)
- `PUT /api/projects/{projectId}/credentials/{credentialId}` – update credential (admin)
- `DELETE /api/projects/{projectId}/credentials/{credentialId}` – delete credential (admin)
- `POST /api/projects/{projectId}/credentials/import` – multipart CSV import (admin)  
  CSV format: `key,value[,type[,description]]`

### Admin & Audit

- `GET /api/admin/users` – list users (admin)
- `POST /api/admin/users/invite` – create user and return a temporary password (admin)
- `PUT /api/admin/users/{id}` – change role / active flag (admin)
- `GET /api/admin/audit-logs` – list audit log entries (admin)

Audit logs are written for credential view/create/update/delete, including user, environment, project, key, IP, and timestamp.

## Frontend Integration Notes

- Frontend should:
  - Call `/api/auth/login` to obtain tokens and store them (e.g. httpOnly cookie or local storage).
  - Attach `Authorization: Bearer <accessToken>` for all authenticated requests.
  - Use reveal endpoint only when the user explicitly clicks to see a secret.

