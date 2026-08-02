# GemSpot KE — Backend API (v1.1)

Flask REST API powering the GemSpot KE frontend.

## Quick start

```bash
cd backend
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt

# SQLite by default (gemspot.db in cwd)
export FLASK_APP=main.py
flask init-db
flask seed
python main.py
# → http://0.0.0.0:5000
```

Production / Postgres:

```bash
export DATABASE_URL=postgresql://user:pass@host/dbname
export SECRET_KEY=...
export JWT_SECRET_KEY=...
gunicorn main:app
```

Frontend expects:

```
VITE_API_BASE_URL=http://localhost:5000/api
```

## Demo accounts (after `flask seed`)

| Email | Password | Role |
|-------|----------|------|
| admin@gemspot.co.ke | AdminPass2026! | admin |
| wanjiku@example.com | Password123! | user |

## API map (aligned with frontend)

| Method | Path | Notes |
|--------|------|-------|
| POST | `/api/auth/register` | Soft-fills name → first/last, email → username |
| POST | `/api/auth/login` | Returns `token` + `access_token` + `user` |
| POST | `/api/auth/logout` | Optional JWT |
| GET | `/api/auth/me` | Current user |
| GET/PATCH | `/api/users/me` | Profile |
| GET | `/api/places` | `?category=nature\|eats\|nightlife\|action&q=` |
| GET | `/api/places/:id` | |
| POST | `/api/places` | Auth; accepts FE field aliases |
| PUT/PATCH | `/api/places/:id` | Auth (Admin dashboard) |
| DELETE | `/api/places/:id` | Auth |
| GET | `/api/events` | `?category=&q=` |
| GET | `/api/events/:id` | |
| POST | `/api/events` | Auth |
| PUT/PATCH | `/api/events/:id` | Auth |
| DELETE | `/api/events/:id` | Auth |
| POST | `/api/events/:id/bookmark` | Toggle |
| GET | `/api/events/user/bookmarks` | |
| GET | `/api/reviews` | `?place_id=` |
| POST | `/api/reviews` | Body: `{ place_id, rating, … }` |
| GET/POST | `/api/reviews/place/:id` | Legacy path still supported |
| GET | `/api/vibes` | Latest vibe checks |
| GET | `/api/vibes/reels` | Video-only |
| GET/POST | `/api/vibes/place/:id` | |
| GET | `/api/favorites` | Auth |
| POST | `/api/favorites` | `{ place_id }` |
| DELETE | `/api/favorites/:place_id` | |
| GET | `/api/categories` | |
| GET | `/api/admin` | Stats (admin JWT) |
| GET | `/api/admin/users` | |
| PATCH | `/api/admin/places/:id/verify` | Toggle verified |

## Model improvements vs previous backend

- **Place**: JSON fields for `activities`, `requirements`, `what_to_bring`, `menu_highlights`, `dietary`, `signature_drinks`; plus `music_vibe`, `peak_hours`, `cover_charge`, `best_time`, `difficulty`. Parking is free-text. `updated_at` column.
- **Event**: `host_name`, `host_org`, `going_count`, `tags` (JSON), `updated_at`.
- Full CRUD for places & events (Admin dashboard PUT/DELETE).
- Reviews & vibes accept both collection and nested-place routes.
- Category resolution accepts frontend slugs (`nature`, `eats`, …) on create/update.
- Seed data mirrors curated frontend `placesData` / demo auth accounts.
