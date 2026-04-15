# Bookmark Manager

Bookmark Manager now supports Neon Postgres through Vercel serverless API routes.

## Environment Setup

1. Copy `.env.example` to `.env`.
2. Set `DATABASE_URL` to your Neon pooled connection string.
3. Install dependencies:

```bash
npm install
```

4. Run the local dev server:

```bash
npm run dev
```

The local server serves the static app and the `/api/bookmarks` endpoints.

## Database Schema SQL

Run this in Neon SQL Editor:

```sql
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS bookmarks (
	id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	name TEXT NOT NULL,
	url TEXT NOT NULL,
	description TEXT DEFAULT '',
	is_pinned BOOLEAN NOT NULL DEFAULT FALSE,
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bookmarks_created_at
ON bookmarks (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_bookmarks_name_lower
ON bookmarks ((lower(name)));

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
	NEW.updated_at = NOW();
	RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_bookmarks_updated_at ON bookmarks;
CREATE TRIGGER trg_bookmarks_updated_at
BEFORE UPDATE ON bookmarks
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();
```

## Core SQL Queries

```sql
-- Insert bookmark
INSERT INTO bookmarks (name, url, description, is_pinned)
VALUES ($1, $2, $3, $4)
RETURNING *;

-- Get all bookmarks
SELECT id, name, url, description, is_pinned, created_at, updated_at
FROM bookmarks
ORDER BY is_pinned DESC, created_at DESC;

-- Search by name
SELECT id, name, url, description, is_pinned, created_at, updated_at
FROM bookmarks
WHERE lower(name) LIKE '%' || lower($1) || '%'
ORDER BY is_pinned DESC, created_at DESC;

-- Update bookmark
UPDATE bookmarks
SET name = $2,
		url = $3,
		description = $4,
		is_pinned = $5
WHERE id = $1
RETURNING *;

-- Delete bookmark
DELETE FROM bookmarks
WHERE id = $1
RETURNING id;
```

## API Endpoints

- `GET /api/bookmarks` : Fetch all bookmarks
- `POST /api/bookmarks` : Create bookmark
- `PATCH /api/bookmarks/:id` : Update name/url/description/isPinned
- `DELETE /api/bookmarks/:id` : Delete bookmark

## Directory Structure

```text
.
├── api/
│   ├── _lib/db.js                 # Neon SQL client
│   └── bookmarks/
│       ├── index.js               # GET/POST bookmarks
│       └── [id].js                # PATCH/DELETE bookmark by id
├── public/
│   ├── index.html
│   ├── pages/
│   ├── scripts/
│   └── styles/
├── src/
├── tests/
├── .env.example
├── package.json
└── vercel.json
```