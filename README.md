# UnoMotors Panel

UnoMotors Panel is a React administration interface for managing a vehicle catalog. The repository contains the existing React/Vite frontend and a small Node.js + Express API in the same npm project.

## Architecture

- React 19, JSX, React Router 7 and Vite 8 remain the frontend stack.
- `server/` contains the Express API and serves `dist` in production.
- Supabase remains the database, authentication provider and Storage provider.
- The browser keeps Supabase Auth and sends the real access token as `Authorization: Bearer ...` to protected API calls.
- The API validates the token, checks administrative authorization, and uses a Supabase client scoped to that user's JWT. It does not use `service_role`.
- RLS remains responsible for database and Storage enforcement.

## Repository structure

```text
src/                 React/Vite frontend and imported assets in src/assets/
server/              Express app, auth, routes, validation and media services
test/                Node test runner tests with isolated inputs
public/              URL-stable static assets such as favicon.svg and icons.svg
docs/                Vehicle model documentation
index.html           Vite frontend entry document
vite.config.js       Vite development proxy and build configuration
```

## Requirements

- Node.js 20 or newer
- npm
- A Supabase project configured for development
- The existing `vehicles` table and `vehicles` Storage bucket

## Installation

```bash
npm install
cp .env.example .env
```

Use placeholders in local configuration; never commit credentials. Express loads `.env` explicitly at startup, while values already exported in the shell take precedence. You can point to another local file with `PANELUNO_ENV_FILE=/absolute/path/to/.env npm start`.

### Frontend variables

```env
VITE_SUPABASE_URL=<SUPABASE_PROJECT_URL>
VITE_SUPABASE_ANON_KEY=<SUPABASE_ANON_KEY>
VITE_DEV_BYPASS_AUTH=false
```

### Server variables

```env
PORT=3000
SUPABASE_URL=<SUPABASE_PROJECT_URL>
SUPABASE_ANON_KEY=<SUPABASE_ANON_KEY>
SUPABASE_ADMIN_USER_IDS=<SUPABASE_USER_UUIDS_COMMA_SEPARATED>
SUPABASE_ADMIN_EMAILS=<ADMIN_EMAILS_COMMA_SEPARATED>
```

`SUPABASE_URL` and `SUPABASE_ANON_KEY` are required for the server. At least one administrative allowlist is also required; the server fails fast with the missing variable names if configuration is incomplete. The API denies access by default, prioritizes `SUPABASE_ADMIN_USER_IDS`, and only accepts an email allowlist match when the email in the Supabase-validated user has `email_confirmed_at`. Never send identity or permission fields in vehicle request bodies.

The frontend development bypass never creates a Supabase token and therefore cannot authorize API requests. It is suitable only for UI work that does not need protected data.

## Commands

```bash
npm install        # Install frontend and backend dependencies
npm run dev        # Start Vite; /api is proxied to Express on port 3000
npm run dev:server # Start Express with Node's watch mode and .env loading
npm run build      # Build the React frontend into dist
npm start          # Validate server variables, then serve dist and /api
npm run lint       # Run ESLint
npm test           # Run unit tests; HTTP integration tests need socket access
```

During development, Vite proxies `/api` to `http://localhost:3000`. For a production-like local run, run `npm run build` followed by `npm start`.

## API

```text
GET /api/health

GET    /api/vehicles
GET    /api/vehicles/:id
POST   /api/vehicles
PATCH  /api/vehicles/:id
DELETE /api/vehicles/:id
PATCH  /api/vehicles/:id/publication
PATCH  /api/vehicles/:id/archive
PATCH  /api/vehicles/:id/order
GET    /api/dashboard

POST   /api/media/draft-cover
POST   /api/media/draft-gallery
POST   /api/vehicles/:id/media/cover
POST   /api/vehicles/:id/media/gallery
```

All protected endpoints require a real Supabase access token and an authorized administrator. The API returns a consistent error shape with `error.code`, `error.message` and optional `error.details`.

## Validation and media behavior

The browser keeps client-side validation, previewing and WEBP conversion for user experience. The server repeats business validation, checks IDs, verifies image size and checks actual JPEG, PNG or WEBP signatures.

Storage and Postgres are not one transaction. The form uses draft upload endpoints, and each upload operation tracks the paths it created and compensates only those paths if a later upload or public URL step fails. Vehicle create/update compensation removes only referenced draft paths when the database operation fails; existing images are retained until the database update succeeds. After a successful update or deletion, old referenced files are cleaned up on a best-effort basis. If cleanup fails, the original database/upload error is preserved and the cleanup problem is logged without paths or secrets in the log. No mass cleanup is performed.

## Testing scope

`npm test` covers health check, authentication, ID/email authorization (including unverified email rejection), vehicle validation and image signatures. It also includes Supertest-based CRUD, publication, upload and compensating-cleanup tests using a simulated Supabase service. Those HTTP tests are skipped—not counted as passed—when the sandbox prohibits local sockets.

Valid and expired JWT verification, RLS behavior, real vehicle CRUD, Storage operations and partial-failure behavior require an isolated Supabase test project or mocks for the Supabase client. Do not run those tests with production credentials or against production data.
