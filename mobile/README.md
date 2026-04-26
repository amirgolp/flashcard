# Flashcard Mobile (Flutter)

Flutter client for the Flashcard app. Talks to the FastAPI backend in `../app/`.

## First-time setup

1. Install the Flutter SDK (3.22+): https://docs.flutter.dev/get-started/install
2. Generate the native Android/iOS folders **without overwriting** the Dart sources already in this repo:

   ```bash
   cd mobile
   flutter create . --project-name flashcard_mobile --platforms=android,ios --org com.flashcard
   ```

3. Install dependencies and codegen:

   ```bash
   flutter pub get
   dart run build_runner build --delete-conflicting-outputs
   ```

4. Copy env template:

   ```bash
   cp .env.example .env
   ```

## Run

Backend must be reachable from the device/emulator. From an Android emulator the host is `10.0.2.2`; on a physical device, use your machine's LAN IP. Adjust `API_BASE_URL` in `.env` accordingly.

```bash
flutter run                  # pick device interactively
flutter run -d chrome        # web, for quick UI iteration
```

## Day-to-day commands

```bash
flutter analyze              # static analysis (CI)
flutter test                 # unit + widget tests (CI)
dart run build_runner watch  # regenerate drift / riverpod code on save
flutter pub upgrade          # bump dependencies
```

## Project layout

```
lib/
├── main.dart
├── core/
│   ├── api/      # Dio client + interceptors
│   ├── auth/     # Zitadel OIDC
│   ├── db/       # drift SQLite (books, cached cards)
│   └── router/   # go_router config
├── features/
│   ├── books/        # PDF import, file index
│   ├── cards/        # flip-card review
│   ├── decks/        # deck management
│   └── generation/   # send text/image → draft cards
└── shared/
    ├── models/       # DTOs matching backend schemas
    └── widgets/      # reusable UI (flip card, hardness badge)
```

## Status

Initial scaffolding only. Acceptance criteria from the tracking ticket — OIDC login, PDF extraction, camera capture, offline review, CI — land in follow-up PRs.
