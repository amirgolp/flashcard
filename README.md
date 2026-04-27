# Flashcard App

A full-stack flashcard learning application built with FastAPI (Python), MongoDB, and React with TypeScript, Vite, and Material-UI.

## 🚀 Getting Started

**Prereqs**: Python 3.11, Node 20, Docker, `uv` (optional).

### First-time setup

```bash
# 1. Env files
cp app/.env.example app/.env
cp gui/.env.example gui/.env

# 2. Python venv
uv venv --python 3.11 .venv && source .venv/bin/activate
uv pip install -r requirements.txt
# (fallback: python3 -m venv .venv && pip install -r requirements.txt)

# 3. Frontend deps
(cd gui && npm install)
```

Optional keys in `app/.env`: `MONGODB_HOST` (Atlas fallback), `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` (Drive), `GEMINI_API_KEY` (AI).

### Day-to-day: three terminals

Mongo runs in Docker; backend and frontend run on the host for fast reloads and real debugger support.

```bash
# Terminal 1 — database (leave running)
docker-compose up -d mongodb

# Terminal 2 — backend
source .venv/bin/activate
uvicorn app.main:app --reload          # or: poe api

# Terminal 3 — frontend
cd gui && npm run dev                  # or: poe gui
```

- API docs → [http://localhost:8000/docs](http://localhost:8000/docs)
- UI → [http://localhost:5173](http://localhost:5173)

> Mongo is mapped to host port **27018** (container-internal 27017) to avoid clashes with other local Mongo instances. If you change the mapping in `docker-compose.yml`, update `LOCAL_MONGODB_URI` in `app/.env` to match.

Stop Mongo when done: `docker-compose down` (add `-v` to wipe the data volume).

### Everything in Docker

For smoke-testing or onboarding, run the full stack:

```bash
docker-compose up -d --build
docker-compose logs -f backend         # tail logs
docker-compose down                    # stop all
```

---

## 🔐 Local Zitadel (OIDC for the mobile app)

The mobile app supports Zitadel OIDC. For development you can run a self-hosted instance from compose instead of using `*.zitadel.cloud`.

### Start it

```bash
docker-compose up -d zitadel_db zitadel
```

- Console: [http://localhost:8081/ui/console](http://localhost:8081/ui/console)
- Discovery: `http://localhost:8081/.well-known/openid-configuration`
- Backed by Postgres (Zitadel v4 dropped CockroachDB support).

The host port is **8081** (not 8080) to dodge collisions; the issuer URL baked into tokens uses 8081 too. To wipe state and reset to a fresh instance: `docker-compose down -v` (drops all volumes including Mongo and Zitadel).

### `ZITADEL_EXTERNAL_DOMAIN` and how to point devices at it

Issued tokens carry `iss = http://${ZITADEL_EXTERNAL_DOMAIN}:8081`, so the device must be able to reach that exact host. Default is `localhost` (works for desktop browser + iOS simulator). Override with a shell var **before** `docker-compose up` if you're running on Android emulator or a physical device:

| Where the Flutter app runs | Set in shell | Use in `--dart-define=ZITADEL_ISSUER=` |
| --- | --- | --- |
| Desktop browser / iOS simulator | _(default)_ | `http://localhost:8081` |
| Android emulator | `export ZITADEL_EXTERNAL_DOMAIN=10.0.2.2` | `http://10.0.2.2:8081` |
| Physical phone on same Wi-Fi | `export ZITADEL_EXTERNAL_DOMAIN=<host LAN IP>` | `http://<LAN IP>:8081` |

### First login + project setup

1. First-boot admin: **`zitadel-admin@zitadel.localhost`** / **`Password1!`** (you'll be prompted to change it). If you set a custom `ZITADEL_EXTERNAL_DOMAIN`, replace `localhost` accordingly.
2. Create a project (e.g. `flashcard`).
3. **Applications → + New → Native** → **PKCE** (no client secret).
4. Redirect URIs: `com.flashcard.mobile:/oauthredirect` (must match exactly).
5. Save and copy the **Client ID**.
6. Pass it to the mobile build via `--dart-define=ZITADEL_CLIENT_ID=<id>` along with `ZITADEL_ISSUER` and `ZITADEL_REDIRECT_URI` (see [mobile/.env.example](mobile/.env.example) for the full command).

When `ZITADEL_*` defines are absent the mobile app falls back to the username/password JWT flow against the FastAPI backend, so OIDC is opt-in for development.

### Backend integration (TODO)

The FastAPI backend currently signs its own JWTs (`SECRET_KEY` in `app/utils/token.py`). Accepting Zitadel-issued tokens needs a small backend change: validate against `${ZITADEL_ISSUER}/oauth/v2/keys` (JWKS), match the audience to the client ID, and map `sub` to a local `User`. Until that lands, mobile clients that authenticated via OIDC won't be able to call the backend successfully — use the username/password fallback for end-to-end testing.

---

## ✨ Implemented Features

### Backend Architecture
- **Authentication**: Secure JWT-based user authentication and password hashing with bcrypt.
- **Decks & Cards Management**: Complete CRUD operations for organizing flashcard decks and individual flashcards, fully restricted by user ownership.
- **Full-Text Search**: Weighted text indexes on flashcards (front, back, examples) enabling extensive search capabilities.
- **Storage Integrations**: Uses **Google Drive** for secure cloud file storage and backups.
- **Extensible Architecture**: Includes modules ready for generative AI (`generation.py`), external literary integration (`books.py`), and storage backups (`storage.py`).
- **AI Generation**: Integrates the **Gemini Model** for AI-powered content and flashcard generation (`generation.py`), alongside external module integration (e.g., `books.py`).
- **Telegram Integration (Under Development)**: allowing users to integrate Telegram to manage their file storage directly within chats.

### Frontend Experience
- **Modern User Interface**: Built leveraging React 18 and Material-UI (MUI 6) for a responsive and premium design system.
- **Interactive Flashcards**: A "real flashcard" experience featuring a smooth flip animation to reveal detailed back-of-card information like translations, grammar, examples, and notes.
- **Streamlined Card UI**: Standardized premium layout across both the main card list and draft review sections.
- **Client-Side Routing**: Handled seamlessly by TanStack Router for fast navigation.
