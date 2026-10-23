# UnoMotors Panel

Web administration panel for managing a vehicle catalog. The application provides a catalog overview, vehicle listing and filtering, record creation and editing, listing order management, vehicle archiving or deletion, and image management.

## Features

- Administrator authentication through Supabase Auth.
- Overview with totals, published and archived vehicles, and recent records.
- Vehicle listing with search by make, model, version, or slug.
- Filters by type and status.
- Vehicle creation and editing with form validation.
- Management of publication status, featured status, archiving, and catalog order.
- Cover and gallery image uploads to Supabase Storage.
- Image conversion to WEBP, resizing, and format and size validation.
- Compatibility with previous project routes through redirects.

## Technologies

- React 19
- React Router 7
- Vite 8
- Supabase JS (Auth, database, and Storage)
- ESLint

## Requirements

- Node.js and npm.
- A Supabase project configured with the `vehicles` table and the Storage bucket used by the application.
- Environment variables configured before starting the application.

## Installation

```bash
npm install
cp .env.example .env
```

Fill in `.env` with the values for your Supabase project. Do not include this file in the repository.

### Environment variables

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

For local development, the application also supports an authentication bypass controlled by Vite:

```env
VITE_DEV_BYPASS_AUTH=false
```

It is only enabled during development (`import.meta.env.DEV`) and must not be enabled in production.

## Commands

```bash
npm run dev      # starts the development server
npm run build    # creates the production build
npm run preview  # serves the generated build locally
npm run lint     # runs ESLint
```

The project currently does not define an automated test command in `package.json`.

## Main structure

```text
src/
├── components/   Reusable components and form sections
├── context/      Authentication state
├── hooks/        Application hooks
├── layouts/      Protected page layouts
├── lib/          Supabase integration, validation, and image processing
├── pages/        Dashboard, listing, creation, editing, and login
├── router/       Public, protected, and compatibility redirect routes
└── styles/       Global and page-specific styles
```

The data integration expects to work with the `vehicles` table and the `vehicles` Supabase Storage bucket.
